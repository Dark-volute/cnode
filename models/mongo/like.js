const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Errors = require('../../error')
const logger = require('../../utils/loggers').logger
const {ObjectId} = Schema.Types

const LIKE_TYPES = {
  TOPIC: 'topic',
  REPLY: 'reply',
  USER: 'user'
}

const LikeSchema = Schema({
  attachedId: {type: ObjectId, required: true, index: true},
  type: {type: String, enum: ['topic', 'reply', 'user'], require: true},
  userId: {type: ObjectId, required: true, index: true},
  ts: {type: Number, default: Date.now().valueOf()},
})

LikeSchema.index({userId: 1, attachedId: 1})

const LikeModel = mongoose.model('like', LikeSchema)

async function like (userId, attachedId, type) {
  let like = await LikeModel.findOne({userId, attachedId})
  if (like) throw new Errors.AlreadyLikedError(userId, attachedId)
  like = await LikeModel.create({
    userId,
    attachedId,
    type,
  })
  .catch(e => {
    logger.error('error creating like record', {err: e.stack || e})
    throw new Errors.InternalError('error creating like record')
  })
  
  return like
}

async function dislike (userId, attachedId) {
  const like = await LikeModel.findOne({userId, attachedId}, {userId: 1, attachedId:1, _id:0})
  if (!like) throw new Errors.NeverLikedError(userId, attachedId)
  await LikeModel.remove({userId, attachedId})
  
  return
}

async function getMyLikes(userId,type){
  let flow = await LikeModel.find({userId: userId,type:type})

  return flow

}

module.exports = {
  model: LikeModel,
  like,
  dislike,
  getMyLikes,
  LIKE_TYPES,
}