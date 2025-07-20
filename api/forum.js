const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Post = require('../models/Post');

// 创建帖子
router.post('/create', async (req, res) => {
  const session = await Post.startSession();
  session.startTransaction();
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 输入验证
    if (!req.body.title || !req.body.content) {
      await session.abortTransaction();
      return res.status(400).json({ error: '标题和内容不能为空' });
    }

    const newPost = new Post({
      title: req.body.title,
      content: req.body.content,
      author: decoded.userId,
      postType: decoded.role === 'official' ? req.body.postType : 'normal',
      isOfficial: decoded.role === 'official' && req.body.postType === 'official',
      likes: [],
      comments: []
    });

    await newPost.save({ session });
    await session.commitTransaction();
    res.status(201).json({ message: '帖子创建成功' });
  } catch (error) {
    await session.abortTransaction();
    console.error('帖子创建失败:', error);
    res.status(500).json({ error: error.message || '服务器错误' });
  } finally {
    session.endSession();
  }
});

// 获取帖子列表
router.get('/list', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username role')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: '获取帖子失败' });
  }
});

// 评论功能
// 新增点赞路由
router.post('/like', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await Post.updateOne(
      { _id: req.body.postId, 'comments._id': req.body.commentId },
      { $addToSet: { 'comments.$.likes': decoded.userId } }
    );

    if (result.nModified === 0) {
      return res.status(404).json({ error: '未找到对应评论' });
    }
    res.json({ message: '点赞成功' });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({ error: error.message || '点赞失败' });
  }
});

// 更新评论功能
router.post('/comment', async (req, res) => {
  const session = await Post.startSession();
  session.startTransaction();
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!req.body.content || req.body.content.length > 500) {
      await session.abortTransaction();
      return res.status(400).json({ error: '评论内容不能为空且不超过500字' });
    }

    const comment = {
      _id: new mongoose.Types.ObjectId(),
      content: req.body.content,
      author: decoded.userId,
      likes: [],
      createdAt: new Date()
    };

    await Post.updateOne(
      { _id: req.body.postId },
      { $push: { comments: comment } },
      { session }
    );

    await session.commitTransaction();
    res.json({ message: '评论成功', commentId: comment._id });
  } catch (error) {
    await session.abortTransaction();
    console.error('评论失败:', error);
    res.status(500).json({ error: error.message || '评论失败' });
  } finally {
    session.endSession();
  }
});

module.exports = router;