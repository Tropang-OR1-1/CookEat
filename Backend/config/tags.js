const db = require("./db");

const updateTagsToEntity = async (client, entityId, tagNames, entityType) => {
    try {
        // Determine the table and foreign key based on the entity type (post or user)
        let tableName, foreignKey;
        if (entityType === 'post') {
            tableName = 'post_tags';
            foreignKey = 'post_id';
        } else if (entityType === 'user') {
            tableName = 'user_tags';
            foreignKey = 'user_id';
        } else {
            throw new Error("Invalid entity type. Please specify 'post' or 'user'.");
        }

        // First, delete existing tags for the given entity
        await client.query(`DELETE FROM ${tableName} WHERE ${foreignKey} = $1;`, [entityId]);
        
        // Now insert new tags for the given entity
        return await insertTagsToEntity(client, entityId, tagNames, tableName, foreignKey);
    } catch (err) {
        throw new Error(`Error updating tags for ${entityType}.`);
        }
};


const insertTagsToEntity = async (client, entityId, tagNames, tableName, foreignKey) => {
    if (!tagNames.length) return;

    if (!Array.isArray(tagNames) || tagNames.length === 0) {
        throw new Error(`${tableName} tag names must be a non-empty array.`);
    }

    const valuesClause = [];
    const queryValues = [];
    for (let i = 0; i < tagNames.length; i++) {
        const tagId = await getOrCreateTagId(tagNames[i]);  // Assuming getOrCreateTagId function exists
        const offset = i * 2;
        valuesClause.push(`($${offset + 1}, $${offset + 2})`);
        queryValues.push(entityId, tagId);
    }
    
    const query = `
        INSERT INTO ${tableName} (${foreignKey}, tags_id)
        VALUES ${valuesClause.join(', ')}
        ON CONFLICT DO NOTHING;
    `;
    try { await client.query(query, queryValues); }
    catch (err) {
        throw new Error(`Error inserting tags for ${tableName}.`);
    }
};

const getOrCreateTagId = async (tagName) => {
    const query = `
        WITH insert_tag AS (
            INSERT INTO tags (name)
            VALUES ($1)
            ON CONFLICT (name) DO NOTHING
            RETURNING id
        )
        SELECT id FROM insert_tag
        UNION
        SELECT id FROM tags WHERE name = $1;
    `;
    try {
        const result = await db.query(query, [tagName]);
        return result.rows[0]?.id;
    } catch (err) {
        throw new Error(`Error getting or creating tag ID for ${tagName}.`);
        }
};


module.exports = {
    updateTagsToEntity,
    insertTagsToEntity,
    getOrCreateTagId    
    }

