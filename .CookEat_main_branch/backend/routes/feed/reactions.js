const express = require('express');
const db = require("../../config/db");
const {allowedReactions, isValidUUID, queryPPID, queryCPID } = require('../../config/defines');

const upload = require('../../config/multer');  // Import multer configuration
const { verifyToken } = require('../../config/jwt'); // Import JWT verification middleware

const router = express.Router();

const validateReactionData = async (reaction, id, type) => {
  if (!reaction || !id) return { error: `${type}_id and reaction are required.` };
  if (typeof reaction !== 'string' || typeof id !== 'string') return { error: "Data values must be string." };
  if (!isValidUUID(id)) return { error: `${type}_id must be in UUID format.` };
  if (!allowedReactions.includes(reaction)) return { error: `Must be a valid reaction for ${type}.` };
  return null;
};

const handleReaction = async (req, res, type, queryFunction, table) => {
  const { reaction, [type === 'post' ? 'post_id' : 'comment_id']: id } = req.body ?? {};
  
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
    return res.status(500).json({ error: error.message });
  }
};

router.post('/post', verifyToken, async (req, res) => {
  handleReaction(req, res, 'post', queryPPID, 'post');
});

router.post('/comment', verifyToken, async (req, res) => {
  handleReaction(req, res, 'comment', queryCPID, 'comment');
});



module.exports = router;

