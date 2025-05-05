const express = require('express');
const db = require("../../config/db");
const {allowedReactions, isValidUUID, queryPPID, queryCPID, getPaginationParams } = require('../../config/defines');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware
const logger = require('../../config/logger');

const router = express.Router();

const validateReactionData = async (reaction, id, type) => {
  if (!id) return { error: `${type}_id are required.` };
  if (!reaction) return { error: "Reaction is required." };
  if (typeof reaction !== 'string' || typeof id !== 'string') return { error: "Data values must be string." };
  if (!isValidUUID(id)) return { error: `${type}_id must be in UUID format.` };
  if (!allowedReactions.includes(reaction)) return { error: `Must be a valid reaction for ${type}.` };
  return null;
};

const handleReaction = async (req, res, type, queryFunction, table) => {
  const { reaction,[type === 'post' ? 'post_id' : 'comment_id']: id } = req.body ?? {};

  const validationError = await validateReactionData(reaction, id, type);
  if (validationError) return res.status(400).json(validationError);

  let pid = await queryFunction(id);
  if (!pid.success) return res.status(400).json({ error: pid.error });
  pid = pid.id;

  const userId = req.user.id;
  const query = `INSERT INTO ${table}_reaction (user_id, ${type}_id, vote)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (user_id, ${type}_id)
                 DO UPDATE SET vote = EXCLUDED.vote;`;

  try {
    const result = await db.query(query, [userId, pid, reaction]);
    if (result.rowCount === 0) return res.status(500).json({ error: "Something went wrong while saving the reaction." });

    return res.status(200).send(`${type.charAt(0).toUpperCase() + type.slice(1)} Reaction (${id}): ${reaction}.`);
  } catch (error) {
    logger.error("Error in handling reaction:", error);
    return res.status(500).json({ error: error.message });
  }
};

router.post('/:type', verifyToken, upload.none(), async (req, res) => {
  const { type } = req.params;
  if (['post','comment'].includes(req.params.type) === false) {
    return res.status(400).json({ error: "Invalid type. Must be 'post' or 'comment'." });
    }
  handleReaction(req, res, type, queryPPID, type);
});


router.delete('/:type/:id', verifyToken, upload.none(), async (req, res) => {
  const { type, id } = req.params;
  if (['post','comment'].includes(type) === false) {
    return res.status(400).json({ error: "Invalid type. Must be 'post' or 'comment'." });
    }
    
  const queryFn = type === 'post' ? queryPPID : queryCPID;  
  handleReactionDelete(req, res, type, queryFn, id);
});


const handleReactionDelete = async (req, res, type, queryFunction, id) => {

  if (!id) return res.status(400).json({ error: `${type}_id is required.` });
  if (typeof id !== 'string') return res.status(400).json({ error: "Data values must be string." });
  if (!isValidUUID(id)) return res.status(400).json({ error: `${type}_id must be in UUID format.` });

  let pid = await queryFunction(id);
  if (!pid.success) return res.status(400).json({ error: pid.error });
  pid = pid.id;

  const userId = req.user.id;
  const query = `DELETE FROM ${type}_reaction WHERE user_id = $1 AND ${type}_id = $2;`;

  try {
    const result = await db.query(query, [userId, pid]);
    if (result.rowCount === 0) return res.status(500).json({ error: "Something went wrong while deleting the reaction." });
    return res.status(200).send(`${type.charAt(0).toUpperCase() + type.slice(1)} Reaction (${id}): deleted.`);
  } catch (error) {
    logger.error("Error in deleting reaction:", error);
    return res.status(500).json({ error: error.message });
  }
};





router.get('/:type/:id', verifyToken, upload.none(), async (req, res) => {
  const { id, type } = req.params;
  let { react } = req.query;

  const defaultLimit = parseInt(process.env.DEFAULT_LIMIT) || 10;
  const { page, limit, offset } = getPaginationParams(req.query, defaultLimit);

  if (react && !allowedReactions.includes(react)) {
    react = undefined;
    }
  if (!['post', 'comment'].includes(type)) {
      return res.status(400).json({ error: "Invalid type. Must be 'post' or 'comment'." });
  }

  const table = `${type}_reaction`;
  const idField = `${type}_id`;
  const idQuery = type === 'post' ? queryPPID : queryCPID;
  const idCheck = await idQuery(id);
  if (!idCheck.success) return res.status(400).json({ error: idCheck.error });
  const pid = idCheck.id;

  let query = `
      SELECT r.vote, u.public_id AS user_id, u.username
      FROM ${table} r
      JOIN user_profile u ON u.id = r.user_id
      WHERE r.${idField} = $1
  `;

  const values = [pid];
  let paramIndex = 2;

  if (react) {
      query += ` AND r.vote = $${paramIndex++}`;
      values.push(react);
  }

  query += ` ORDER BY r.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
  values.push(limit, offset);

  try {
      const result = await db.query(query, values);
      res.status(200).json({ page, limit, result: result.rows });
  } catch (err) {
    logger.error(`Error in getting paginating ${type} reactions:`, err);
    res.status(500).json({ error: "Failed to get paginated reactions." });
  }
});


module.exports = router;

