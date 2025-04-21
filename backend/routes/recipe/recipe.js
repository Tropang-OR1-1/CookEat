const express = require('express');
const db = require("../../config/db");

const { insertMedia, deleteFile, updateMedia } = require('../../config/uploads');
const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware
const { stringArrayParser, validateArrayInput, allowedRecipeDifficulty,
        sanitizeInput, queryRPID, isValidUUID, 
        allowedDeleteMedia } = require('../../config/defines');
require('dotenv').config({ path: '../.env' });

const router = express.Router();

const isvalidtitleLength = (title) => { return title.length <= process.env.MAX_RECIPE_TITLE_LENGTH; }


const hasUploadedMedia = (media) => {
    return media && media.length > 0;
    }

const insertRecipeMedia = async (client, files, recipeId) => {
    return await insertMedia({
        client,
        files,
        targetId: recipeId,
        tableName: 'recipemedia',
        foreignKey: 'recipe_id',
        imageDir: process.env.RECIPE_IMAGE_DIR,
        videoDir: process.env.RECIPE_VIDEO_DIR,
        includeStepNumbers: true
        });
    }

const updateRecipeMedia = async (client, files, recipeId) => {
    return await updateMedia({
        client, 
        files,
        targetId: recipeId,
        tableName: 'recipemedia',
        idColumn: 'recipe_id',
        imageDir: process.env.RECIPE_IMAGE_DIR,
        videoDir: process.env.RECIPE_VIDEO_DIR
    });
    }

const deleteRecipeMedia = async (client, recipeId, mediaType) => {
    await deleteMedia({
        client,
        targetId: recipeId,
        tableName: 'recipemedia',
        idColumn: 'recipe_id',
        imageDir: process.env.RECIPE_IMAGE_DIR,
        videoDir: process.env.RECIPE_VIDEO_DIR,
        mediaType
    });
    
    }

//verifyToken, upload.recipeThumbnail.single("thumbnail"),
//upload.recipeSteps.array('media',  process.env.MAX_RECIPE_MEDIA)
  /*  combinedRecipeUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'media', maxCount: parseInt(process.env.MAX_RECIPE_MEDIA || '10') }
  ]*/
router.post('/', verifyToken,
    upload.combinedRecipeUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'media', maxCount: parseInt(process.env.MAX_RECIPE_MEDIA || '10') }
    ]), async (req, res) => {
    let { title, description, ingredients, steps, category,
        prep_time, cook_time, servings, difficulty } = req.body ?? {};

    if (!title || !description || !ingredients || !steps)
        return res.status(400).json({ error: '(title, description, ingredients, steps) are required.' });

    if (!isvalidtitleLength(title)) {
        return res.status(400).json({ error: "Title is too long." });
        } // check title length
    
        
    if (typeof title !== 'string' || typeof description !== 'string')
        return res.status(400).json({ error: 'title and description must be a string.' });

    const processed_ingredient = validateIngredients(ingredients);
    if (!processed_ingredient.success)
        return res.status(400).json({ error: processed_ingredient.error });

    const processed_steps = validateSteps(steps);
    if (!processed_steps.success)
        return res.status(400).json({ error: processed_steps.error });
    
    let processed_category = undefined;
    if (category !== undefined){
        let maxItem = parseInt(process.env.CATEGORY_MAX_ITEM) || 20;
        let maxCharLength = parseInt(process.env.CATEGORY_MAX_CHAR_LENGTH) || 50;
        processed_category = validateArrayInput(category, {maxLength: maxCharLength, maxItems: maxItem});
        if (!processed_category.success)
            return res.status(400).json({ error: processed_category.error });
        }
    
    let processed_preptime = undefined;
    if (prep_time !== undefined){
        processed_preptime = parseInt(prep_time, 10);
        if (isNaN(processed_preptime))
            return res.status(400).json({ error: `prep_time is NaN.` });
        }

    let processed_cooktime = undefined;
    if (cook_time !== undefined){
        processed_cooktime = parseInt(cook_time, 10);
        if (isNaN(processed_cooktime))
            return res.status(400).json({ error: `cook_time is NaN.` });
        }

    let processed_servings = undefined;
    if (servings !== undefined){
        processed_servings = parseInt(servings, 10);
        if (isNaN(processed_servings))
            return res.status(400).json({ error: `servings is NaN.` });
        }
    
    let processed_difficulty = undefined;
    if (difficulty !== undefined){
        if (!allowedRecipeDifficulty.includes(difficulty))
            return res.status(400).json({ error: 'Must be a valid difficulty.' });
        else processed_difficulty = difficulty;
        }
    
    let thumbnail = req.files['thumbnail'];
    if (hasUploadedMedia(thumbnail))
        thumbnail = thumbnail[0].filename; // This will be the thumbnail file
    else thumbnail = undefined;


    const client = await db.connect();
    try {
        await client.query('BEGIN;');

        const query = `INSERT INTO recipe 
                (title, description, author_id, prep_time, cook_time, servings, difficulty, steps, thumbnail)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                RETURNING id, public_id`;
        const value = [ title, description, req.user.id,
                processed_preptime, processed_cooktime,
                processed_servings, processed_difficulty, processed_steps.data
                , thumbnail ];
        
        const { rows } = await client.query(query, value);
        if ( !rows.length  ) { return res.status(500).json({ error: "Error Inserting a recipe." }); }
        // recipe pushed

        const recipeId = rows[0].id;
        await insertIngredientsToRecipe(client, recipeId, processed_ingredient.data);

        if (processed_category !== undefined)
            await insertCategoriesToRecipe(client, recipeId, processed_category.data);
        
        const media = req.files['media'];
        if (hasUploadedMedia(media)){ // extras
            const insertmedia = await insertRecipeMedia(client, media, recipeId);
            if (!insertmedia.success)
                return res.status(400).json({error: insertmedia.error });
            }

        await client.query('COMMIT');
        return res.status(200).json({ msg: "recipe created successfully.", recipe_id: rows[0].public_id });
        } catch (err) {
            await client.query('ROLLBACK;');
            return res.status(500).json({ error: "Database error.", err });
            }
        finally {
            client.release();
            }
    });


router.put('/:recipeId', verifyToken, 
    upload.combinedRecipeUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'media', maxCount: parseInt(process.env.MAX_RECIPE_MEDIA || '10') }
    ]), async (req, res) => {

    let { title, description, ingredients, steps, category, 
        prep_time, cook_time, servings, difficulty, deleteMedia, deleteThumbnail } = req.body ?? {};

    const public_recipe_id = req.params.recipeId;
    let thumbnail = req.files['thumbnail'];
    const media = req.files['media'];

    const Hasupdate = 
            title !== undefined || description !== undefined ||
            steps !== undefined || prep_time !== undefined ||
            cook_time !== undefined || servings !== undefined ||
            difficulty !== undefined || req.file !== undefined ||
            deleteMedia !== undefined || deleteThumbnail !== undefined ||
            hasUploadedMedia(thumbnail);

    if (!Hasupdate &&
        ingredients === undefined &&
        category === undefined &&
        !hasUploadedMedia(media))
        return res.status(400).json({ error: 'No Attributes provided.' });
    
    if (!isValidUUID(public_recipe_id)) // security measures
        return res.status(400).json({ error: "Invalid recipe UUID(s) provided."});
    
    let recipe_id = await queryRPID(public_recipe_id);
    if (!recipe_id.success) return res.status(404).json({ error: recipe_id.error });
    else recipe_id = recipe_id.id;
    
    if (hasUploadedMedia(thumbnail)){
        thumbnail = thumbnail[0];
        console.log(thumbnail.filename);
        }
    
    let processed_title = undefined;
    if ((title !== undefined && typeof title !== 'string'))
        return res.status(400).json({error: "Title must be a valid string."});
    
    if (typeof title === 'string' && !isvalidtitleLength(title))
        return res.status(400).json({error: "title is too long."});
    if (title === "")
        return res.status(400).json({error: "Title cannot be empty."});
    else processed_title = sanitizeInput(title); 

    let processed_description = undefined;
    if (description !== undefined && typeof description !== 'string')
        return res.status(400).json({ error: "Description must be a valid string." });
    else processed_description = sanitizeInput(description);

    let processed_category = undefined;
    if (category !== undefined){
        let maxItem = parseInt(process.env.CATEGORY_MAX_ITEM) || 20;
        let maxCharLength = parseInt(process.env.CATEGORY_MAX_CHAR_LENGTH) || 50;
        processed_category = validateArrayInput(category, {maxLength: maxCharLength, maxItems: maxItem});
        if (!processed_category.success)
            return res.status(400).json({ error: processed_category.error });
        }
    
    let processed_ingredient = undefined;
    if (ingredients !== undefined){
        processed_ingredient = validateIngredients(ingredients);
        if (!processed_ingredient.success)
            return res.status(400).json({ error: processed_ingredient.error });
        }

    let processed_steps = undefined; // steps validation
    if (steps !== undefined){
        processed_steps = validateSteps(steps);
        if (!processed_steps.success)
            return res.status(400).json({ error: processed_steps.error });
        else  processed_steps = processed_steps.data;
        }

    let processed_preptime = undefined;
    if (prep_time !== undefined){
        processed_preptime = parseInt(prep_time, 10);
        if (isNaN(processed_preptime))
            return res.status(400).json({ error: `prep_time is NaN.` });
        }

    let processed_cooktime = undefined;
    if (cook_time !== undefined){
        processed_cooktime = parseInt(cook_time, 10);
        if (isNaN(processed_cooktime))
            return res.status(400).json({ error: `cook_time is NaN.` });
        }

    let processed_servings = undefined;
    if (servings !== undefined){
        processed_servings = parseInt(servings, 10);
        if (isNaN(processed_servings))
            return res.status(400).json({ error: `servings is NaN.` });
        }
    
    let processed_difficulty = undefined;
    if (difficulty !== undefined){
        if (!allowedRecipeDifficulty.includes(difficulty))
            return res.status(400).json({ error: 'Must be a valid difficulty.' });
        else processed_difficulty = difficulty;
        }
    
    if (deleteMedia !== undefined && !allowedDeleteMedia.includes(deleteMedia))
        { return res.status(400).json({error: `Invalid Deletemedia(image, video, all): ${deleteMedia}`}); }

    if (deleteThumbnail !== undefined && deleteThumbnail !== "True")
        deleteThumbnail = undefined;

    const client = await db.connect();
    try {
        await client.query('BEGIN;');

        if (processed_category !== undefined)
            await updateCategoryTorecipe(client, recipe_id, processed_category.data);
        if (processed_ingredient !== undefined)
            await updateIngredientsTorecipe(client, recipe_id, processed_ingredient.data);

        if (deleteMedia !== undefined)
            await deleteRecipeMedia(client, recipe_id, deleteMedia);

        if (hasUploadedMedia(media)){ // manage files
            const result = await updateRecipeMedia(db, media, recipe_id);
            if (!result.success){ throw new Error(result.err); }
            }
        //console.log(thumbnail);

        if (Hasupdate){
            const result = await updateRecipe(recipe_id, {
                client,
                title: processed_title,
                description: processed_description,
                steps: processed_steps, // array
                prep_time: processed_preptime,
                cook_time: processed_cooktime,
                servings: processed_servings,
                difficulty: processed_difficulty,
                file: thumbnail,
                deleteThumbnail
                });
            
            if (result.success && result.oldThumbnail) {
                console.log(`Deleting ${result.oldThumbnail}`);
                deleteFile(process.env.RECIPE_THUMBNAIL_DIR, result.oldThumbnail);
                }
            }

        await client.query('COMMIT;');
        return res.status(200).json({ msg: "Recipe updated successfully.", recipe_id: public_recipe_id });
        }
    catch (err) {
        await client.query('ROLLBACK;');
        console.log(err);
        return res.status(500).json({ error: "An internal error occurred." });
        }
    finally {
        client.release();
        }

    });

router.delete('/:recipeId', verifyToken, async (req, res) => { // perform 
    const { recipeId } = req.params;
    const userId = req.user.id;


    try {
        const result = await db.query(
            `SELECT id, author_id FROM recipe WHERE public_id = $1 AND deleted_at IS NULL`,
            [recipeId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Recipe not found or already deleted' });
        }

        const recipe = result.rows[0];

        if (recipe.author_id !== userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this recipe' });
        }

        await db.query(
            `UPDATE recipe SET deleted_at = NOW() WHERE id = $1`,
            [recipe.id]
        );

        return res.status(200).json({ message: 'Recipe soft-deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'An error occurred while deleting the recipe' });
    }
});


const updateIngredientsTorecipe = async (client, recipeId, ingredients) => {
    try {

        await client.query(`DELETE FROM ri_junction WHERE recipe_id = $1;`, [recipeId]);
        return await insertIngredientsToRecipe(client, recipeId, ingredients);
        } catch (err) { throw new Error("Error updating ingredients."); }
    }
const updateCategoryTorecipe = async (client, recipeId, category) => {
    try {
    await client.query(`DELETE FROM rc_junction WHERE recipe_id = $1;`, [recipeId]);
    return await insertCategoriesToRecipe(client, recipeId, category);
        } catch (err) {
        throw new Error("Error updating category."); }
    }

const insertIngredientsToRecipe = async (client, recipeId, ingredients) => {
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
        throw new Error("Ingredients must be a non-empty array");
    }
    let query = `INSERT INTO ri_junction (recipe_id, ingredient_id, quantity, unit) VALUES `;
    const values = [];
    const placeholders = [];

    let i = 1;

    for (const ingredient of ingredients) {
        const ingredientId = await getOrCreateIngredientId(ingredient.name);

        placeholders.push(`($${i}, $${i + 1}, $${i + 2}, $${i + 3})`);
        values.push(recipeId, ingredientId, ingredient.quantity, ingredient.unit);
        i += 4;
    }

    query += placeholders.join(', ');
    await client.query(query, values);
};

const insertCategoriesToRecipe = async (client, recipeId, categoryNames) => {
    if (!Array.isArray(categoryNames)) {
        throw new Error("categoryNames must be an array.");
        }
    if (!categoryNames.length) return;
    
    const valuesClause = [];
    const queryValues = [];
    for (let i = 0; i < categoryNames.length; i++) {
        const categoryId = await getOrCreateCategoryId(categoryNames[i]);
        const offset = i * 2;
        valuesClause.push(`($${offset + 1}, $${offset + 2})`);
        queryValues.push(recipeId, categoryId);
        }

    const query = `
        INSERT INTO rc_junction (recipe_id, category_id)
        VALUES ${valuesClause.join(', ')}
        ON CONFLICT DO NOTHING;`;

    await client.query(query, queryValues);
    };

const getOrCreateIngredientId = async (name) => {
    const query = `
        WITH insert_ingredient AS (
            INSERT INTO ingredient (name)
            VALUES ($1)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        )
        SELECT id FROM insert_ingredient
        UNION
        SELECT id FROM ingredient WHERE name = $1
    `;
    const result = await db.query(query, [name]);
    return result.rows[0]?.id;
};

const getOrCreateCategoryId = async (categoryName) => {
    const query = `
        WITH insert_category AS (
            INSERT INTO category (category)
            VALUES ($1)
            ON CONFLICT (category) DO NOTHING
            RETURNING id
        )
        SELECT id FROM insert_category
        UNION
        SELECT id FROM category WHERE category = $1
    `;
    const result = await db.query(query, [categoryName]);
    return result.rows[0]?.id;
};





const validateSteps = (steps) => {
    // Parse the input steps (to handle cases where it's a stringified array)
    const parsedSteps = stringArrayParser(steps);

    // Check if steps is an array
    if (!Array.isArray(parsedSteps)) {
        return { success: false, error: 'Steps should be an array.' };
    }

    // Check if the array is not empty
    if (parsedSteps.length === 0) {
        return { success: false, error: 'Steps should be a non-empty array.' };
    }

    // Sanitize each step to prevent XSS
    const sanitizedSteps = parsedSteps.map(step => sanitizeInput(step));

    // Check if every element in the steps array is a string
    const isValid = sanitizedSteps.every(step => typeof step === 'string');
    if (!isValid) {
        return { success: false, error: 'Each step should be a string.' };
    }

    // Return the sanitized data
    return { success: true, data: sanitizedSteps };
};

const MAX_INGREDIENTS = parseInt(process.env.INGRIDIENTS_MAX_ITEM, 10) || 10; // fallback if not set
const MAX_INGREDIENTS_LENGTH = parseInt(process.env.INGRIDIENTS_MAX_CHAR_LENGTH, 10) || 30;

const validateIngredients = (
    ingredients,
    minIngredients = 1,
    maxIngredients = MAX_INGREDIENTS,
    minUnitLength = 1,
    maxUnitLength = 5,
    maxNameLength = MAX_INGREDIENTS_LENGTH
) => {
    // First, parse ingredients if they're passed as a stringified array
    const parsedIngredients = stringArrayParser(ingredients);

    if (!Array.isArray(parsedIngredients)) {
        return { success: false, error: 'Failed to parse ingredient data.' };
    }
    if (parsedIngredients.length === 0) {
        return { success: false, error: 'Ingredients should be a non-empty array.' };
    }

    if (parsedIngredients.length < minIngredients || parsedIngredients.length > maxIngredients) {
        return { success: false, error: `Ingredients array size should be between ${minIngredients} and ${maxIngredients}.` };
    }

    try {
        let errors = [];
        // Normalize and sanitize ingredients
        const normalizedIngredients = parsedIngredients.map((item, index) => {
            const name = sanitizeInput(item.name);
            const unit = sanitizeInput(item.unit);
            const quantity = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;

            // Validate name length
            if (name.length > maxNameLength) {
                errors.push({ index, error: `Ingredient name "${name}" exceeds the maximum length of ${maxNameLength} characters.` });
            }

            // Validate quantity (should be a valid number)
            if (isNaN(quantity) || !isFinite(quantity) || quantity < 0) {
                errors.push({ index, error: `Invalid quantity for ingredient "${name}". Quantity should be a positive number.` });
            }

            return { name, quantity, unit };
        });

        // If there are any errors, return them
        if (errors.length > 0) {
            const errorMessages = errors.map(err => `Ingredient at index ${err.index}: ${err.error}`).join(', ');
            return { success: false, error: `Validation errors: ${errorMessages}` };
        }

        // Validate each ingredient
        const isValid = normalizedIngredients.every(item =>
            item.hasOwnProperty('name') &&
            item.hasOwnProperty('quantity') &&
            item.hasOwnProperty('unit') &&
            typeof item.name === 'string' &&
            typeof item.unit === 'string' &&
            typeof item.quantity === 'number' &&
            !isNaN(item.quantity) &&
            isFinite(item.quantity) &&
            item.quantity >= 0 &&
            item.unit.length >= minUnitLength &&
            item.unit.length <= maxUnitLength
        );

        if (!isValid) {
            return {
                success: false,
                error: `Invalid ingredient format or missing required attributes. Ensure name, quantity, and unit are correctly formatted. Quantity should be a valid float and unit length should be between ${minUnitLength} and ${maxUnitLength} characters.`
            };
        }

        return {
            success: true,
            error: null,
            data: normalizedIngredients
        };

    } catch (err) {
        return {
            success: false,
            error: 'Data formatting error in ingredients. Please ensure the structure is correct.'
        };
    }
};



const updateRecipe = async (recipeId, {
    client,
    title,
    description,
    steps,
    prep_time,
    cook_time,
    servings,
    difficulty,
    file,
    deleteThumbnail // this is req.file
}) => {

    try {
        await client.query('BEGIN');

        let oldThumbnail = null;

        // Fetch current thumbnail if new one is provided
        if (file !== undefined || deleteThumbnail === "True" ) {
            const thumbRes = await client.query(
                `SELECT thumbnail FROM recipe WHERE id = $1`,
                [recipeId]
            );
            if (thumbRes.rows.length > 0) {
                oldThumbnail = thumbRes.rows[0].thumbnail;
                console.log("old: "+ oldThumbnail);
            }
        }

        const fields = [];
        const values = [];
        let index = 1;

        if (title !== undefined) {
            fields.push(`title = $${index++}`);
            values.push(title);
        }
        if (description !== undefined) {
            fields.push(`description = $${index++}`);
            values.push(description);
        }
        if (steps !== undefined) {
            fields.push(`steps = $${index++}`);
            values.push(steps);
        }
        if (prep_time !== undefined) {
            fields.push(`prep_time = $${index++}`);
            values.push(prep_time);
        }
        if (cook_time !== undefined) {
            fields.push(`cook_time = $${index++}`);
            values.push(cook_time);
        }
        if (servings !== undefined) {
            fields.push(`servings = $${index++}`);
            values.push(servings);
        }
        if (difficulty !== undefined) {
            fields.push(`difficulty = $${index++}`);
            values.push(difficulty);
        }
        if (file !== undefined) {
            fields.push(`thumbnail = $${index++}`);
            values.push(file.filename); // or file.path if you store full path
            }
        else if (deleteThumbnail === "True"){
            fields.push(`thumbnail = $${index++}`);
            values.push(null); // or file.path if you store full path    
            }   

        // Always update updated_at
        fields.push(`updated_at = NOW()`);

        if (fields.length === 0) {
            await client.query('ROLLBACK');
            return { success: false, message: "No valid fields to update." };
        }

        const query = `
            UPDATE recipe
            SET ${fields.join(', ')}
            WHERE id = $${index}
        `;
        values.push(recipeId);

        await client.query(query, values);
        await client.query('COMMIT');
        return { success: true, oldThumbnail };

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating recipe:', error);
        return { success: false, error: 'Database error while updating recipe.' };
    }
};

module.exports = router;


