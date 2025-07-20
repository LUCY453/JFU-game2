class ForumComponent {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'forumScreen';
    this.container.className = 'screen';
    
    this.posts = [];
    this.currentPage = 1;
  }

  async init() {
    this.renderHeader();
    await this.loadPosts();
    this.renderPosts();
    this.addEventListeners();
    return this.container;
  }

  renderHeader() {
    const user = JSON.parse(localStorage.getItem('user'));
    this.container.innerHTML = `
      <div class="forum-header">
        <h2>游戏论坛</h2>
        ${user?.role === 'official' ? 
          `<button class="btn post-type-toggle">切换发帖模式</button>` : ''}
        <button class="btn new-post">新建帖子</button>
      </div>
      <div class="posts-list"></div>
      <div class="pagination"></div>
    `;
  }

  async loadPosts() {
    try {
      const response = await fetch('/api/forum/list');
      this.posts = await response.json();
    } catch (error) {
      console.error('加载帖子失败:', error);
    }
  }

  renderPosts() {
    const list = this.container.querySelector('.posts-list');
    list.innerHTML = this.posts.map(post => `
      <div class="post-item ${post.isOfficial ? 'official' : ''}">
        <div class="post-header">
          <span class="badge">${post.isOfficial ? '官方' : '玩家'}</span>
          <h3>${post.title}</h3>
          <span class="author">${post.author.username}</span>
        </div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
          <button class="btn like" data-postid="${post._id}">
            👍 ${post.likes?.length || 0}
          </button>
          <button class="btn comment" data-postid="${post._id}">
            💬 ${post.comments?.length || 0}
          </button>
        </div>
      </div>
    `).join('');
  }

  addEventListeners() {
    // 添加切换发帖模式事件
    const toggleBtn = this.container.querySelector('.post-type-toggle');
    if(toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        console.log('切换发帖模式点击');
        this.togglePostType();
      });
    }

    // 添加移动端触摸事件
    this.container.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      console.log(`触摸开始 X:${touch.clientX}, Y:${touch.clientY}`);
    }, { passive: true });
    
    // 帖子点赞和评论事件处理
    this.container.querySelectorAll('.like').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.handleLike(btn.dataset.postid);
      });
    });

    this.container.querySelectorAll('.comment').forEach(btn => {
      btn.addEventListener('click', async () => {
        await this.handleComment(btn.dataset.postid);
      });
    });

    this.container.querySelector('.new-post').addEventListener('click', () => {
      this.showPostEditor();
    });
  }

  togglePostType() {
    const user = JSON.parse(localStorage.getItem('user'));
    if(user?.role === 'official') {
      const isOfficialMode = localStorage.getItem('postType') === 'official';
      localStorage.setItem('postType', isOfficialMode ? 'normal' : 'official');
      alert(`已切换到${isOfficialMode ? '普通' : '官方'}发帖模式`);
    }
  }

  async handleLike(postId) {
    try {
      const response = await fetch(`/api/forum/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId })
      });
      if(response.ok) await this.loadPosts();
    } catch (error) {
      console.error('点赞失败:', error);
    }
  }

  async handleComment(postId) {
    const content = prompt('请输入评论内容');
    if(!content) return;
    
    try {
      const response = await fetch(`/api/forum/comment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ postId, content })
      });
      if(response.ok) await this.loadPosts();
    } catch (error) {
      console.error('评论失败:', error);
    }
  }

  showPostEditor() {
    // 帖子编辑器界面实现
  }
}