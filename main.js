// phina.js をグローバル領域に展開
phina.globalize();

var SCREEN_WIDTH  = 640; // 画面横サイズ
var SCREEN_HEIGHT = 960; // 画面縦サイズ
var enemyNum = 5; // enemyの数
var killNum; // kill数
var time;

var ASSETS = {
  image: {
      enemy:'./image/enemy.png',
      player:'./image/player.png',
      player_bullet:'./image/player_bullet.png'
  }
};

// TitleSceneクラスを定義
phina.define('TitleScene',{
  superClass: 'DisplayScene',
  init: function(){
    this.superInit();
    Label({
      text: 'シューティングゲーム',
      fontSize: 64,
      fill: '#FFFFFF',
    }).addChildTo(this).setPosition(this.gridX.center(),this.gridY.span(4));

    Label({
      text: 'TOUCH START',
      fontSize: 32,
      fill: '#FFFFFF',
    }).addChildTo(this)
    .setPosition(this.gridX.center(),this.gridY.span(12))
    .tweener.fadeOut(750).fadeIn(500).setLoop(true).play();

    this.on('pointend',function() {
      this.exit();
    });
  },
});

// MainScene クラスを定義
phina.define('MainScene', {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit();
    killNum = 0;
    time = 0;
    // kill数表示
    this.label_killed = Label({
      text: '',
      fontSize: 20,
      fill: '#FFFFFF',
    }).addChildTo(this).setPosition(580,920);
    // 残り時間表示
    this.label_time = Label({
      text: '',
      fontSize: 54,
      fill: '#FFFFFF',
    }).addChildTo(this).setPosition(this.gridX.center(),this.gridY.center());
    // プレイヤー作成
    this.player = Player().addChildTo(this).setPosition(SCREEN_WIDTH / 2,SCREEN_HEIGHT / 2);
    // 敵グループ作成
    this.enemyGroup = DisplayElement().addChildTo(this);
    // 弾グループ作成
    this.bulletGroup = DisplayElement().addChildTo(this);
    // 敵生成
    for(let i = 0;i < enemyNum;i++){
       this.generateEnemy();
    };
  },
  // 敵生成処理
  generateEnemy: function() {
    // 敵種類決め
      let rand = Random.randint(1, 4);
      if(rand == 1){
        gravityEnemy().addChildTo(this.enemyGroup);
      }else if(rand == 2){
        U_motionEnemy().addChildTo(this.enemyGroup);
      }else if(rand == 3){
        U_reflectEnemy().addChildTo(this.enemyGroup);
      }else if(rand == 4){
        G_reflectEnemy().addChildTo(this.enemyGroup);
      }
  },
  // タッチ時弾発射
  onpointstart: function(e) {
    Bullet().addChildTo(this.bulletGroup).setPosition(e.pointer.x,e.pointer.y);
  },
  // EnemyとPlayerの当たり判定処理
  hitTestEnemyPlayer: function() {
    var player = this.player;
    var self = this;
    // 敵をループ
    this.enemyGroup.children.each(function(enemy) {
      // 判定用の円
      var c1 = Circle(enemy.x,enemy.y,50);
      var c2 = Circle(player.x,player.y,50); 
      // 円判定
      if (Collision.testCircleCircle(c1,c2)) {
        self.exit();
      }
    });
  },
  // EnemyとBulletの当たり判定処理
  hitTestEnemyBullet: function() {
    var self = this;
    // 敵をループ
    this.enemyGroup.children.each(function(enemy) {
      self.bulletGroup.children.each(function(bullet) {
        // 判定用の円
        var c1 = Circle(enemy.x,enemy.y,50);
        var c3 = Circle(bullet.x,bullet.y,20); 
        // 円判定
        if (Collision.testCircleCircle(c1,c3)) {
          killNum++;
          bullet.remove();
          enemy.remove();
          self.generateEnemy();
        }
      });
    });
  },
  update: function(app){
    time += app.deltaTime;
    var timed = Math.floor(time / 1000);
    timeCount = 30 - timed;
    this.label_time.text = '残り時間：' + timeCount;
    this.hitTestEnemyBullet();
    this.hitTestEnemyPlayer();
    this.label_killed.text = 'killed：' + killNum;
    var self = this;
    if(timeCount <= 0){
      self.exit();
    }
  }
});

// Playerクラス
phina.define('Player',{
  superClass: 'Sprite',
  init:function(){
    this.superInit('player',100,100);
    this.setInteractive(true); // タッチ可能にする
  },
  update: function(app) {
    //　移動処理
    var p = app.pointer;
    this.x = p.x;
    this.y = p.y;
    // 画面外はみ出し判定
    if (this.left < 0) {
      this.left = 0;
      this.physical.velocity.x *= -1;
    }else if (this.right > SCREEN_WIDTH) {
      this.right = SCREEN_WIDTH;
      this.physical.velocity.x *= -1;
    }
    if (this.top < 0) {
      this.top = 0;
      this.physical.velocity.y *= -1;
    }else if (this.bottom > SCREEN_HEIGHT) {
      this.bottom = SCREEN_HEIGHT;
      this.physical.velocity.y *= -1;
    }
  },
});

// Bulletクラス
phina.define('Bullet',{
  superClass: 'Sprite',
  init:function(player_x,player_y){
    this.superInit('player_bullet',30,30);
    this.physical.velocity.y = -15;
  },
  update: function(){
    if (this.top < 0) {
      this.remove(); //自身を削除
    }
  }
});

// Enemyクラス
phina.define('Enemy',{
  superClass: 'Sprite',
  init:function(){
    this.superInit('enemy',100,100);
    this.x =　Random.randint(50,SCREEN_WIDTH - 100);
    this.y =- this.height;
  },
  update: function(){
    if (this.bottom > SCREEN_HEIGHT) {
      this.bottom = SCREEN_HEIGHT;
      this.y =- this.height;
      this.x = Random.randint(50,SCREEN_WIDTH - 100);
    }
  }
});

//等速落下enemy
phina.define('U_motionEnemy',{
  superClass: 'Enemy',
  init:function(){
    this.superInit();
    let speed = Random.randint(3,10);
    this.physical.velocity.y = speed;
  },
});

// 壁反射enemy(等速)
phina.define('U_reflectEnemy',{
  superClass: 'U_motionEnemy',
  init:function(){
    this.superInit();
    let rand = Random.randint(1,100);
    let angle = Random.randint(2,10);
    if(rand % 2 == 0){
      this.physical.velocity.x = angle;
    }else{
      this.physical.velocity.x = -angle;
    }
  },
  update: function(){
    // 画面外はみ出し判定
    if (this.left < 0) {
      this.left = 0;
      this.physical.velocity.x *= -1;
    }else if (this.right > SCREEN_WIDTH) {
      this.right = SCREEN_WIDTH;
      this.physical.velocity.x *= -1;
    }
    this.superMethod('update');
  }
});

//重力落下enemy
phina.define('gravityEnemy',{
  superClass: 'Enemy',
  init:function(){
    this.superInit();
    this.physical.gravity.y = 0.5;
  },
  update: function(){
    if (this.bottom > SCREEN_HEIGHT) {
      this.physical.velocity.y = 0;
    }
    this.superMethod('update');
  }
});

// 壁反射enemy(重力)
phina.define('G_reflectEnemy',{
  superClass: 'gravityEnemy',
  init:function(){
    this.superInit();
    let rand = Random.randint(1,100);
    let angle = Random.randint(2,10);
    if(rand % 2 == 0){
      this.physical.velocity.x = angle;
    }else{
      this.physical.velocity.x = -angle;
    }
  },
  update: function(){
    // 画面外はみ出し判定
    if (this.left < 0) {
      this.left = 0;
      this.physical.velocity.x *= -1;
    }else if (this.right > SCREEN_WIDTH) {
      this.right = SCREEN_WIDTH;
      this.physical.velocity.x *= -1;
    }
    this.superMethod('update');
  }
});

//resultScene クラスを定義
phina.define("ResultScene", {
  superClass: 'DisplayScene',
  init: function() {
    this.superInit();
    Label({
      text: 'killed：' + killNum,
      fontSize: 60,
      fill: 'white',
    }).addChildTo(this).setPosition(this.gridX.center(),this.gridY.span(4));
    this.restartButton = RestartButton().addChildTo(this).setPosition(320,800);
    var self = this;
    this.restartButton.onpointend = function() {
      self.exit();
    };
  },
});

// RestartButtoクラスを定義
phina.define('RestartButton', {
  superClass: 'Button',
  init: function() {
    this.superInit({
      width: 300, // 横サイズ
      height: 155, // 縦サイズ
      text: 'restart',  // 表示文字
      fontSize: 70, // 文字サイズ
      fontColor: '#000000', // 文字色
      cornerRadius: 5,  // 角丸み
      fill: '#FFFFFF', // ボタン色
      stroke: '#000000',  // 枠色
      strokeWidth: 5,   // 枠太さ
    });
  },
});

// メイン処理
phina.main(function() {
  // アプリケーション生成
  var app = GameApp({
    assets: ASSETS,
    backgroundColor: '#000000',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  });
  // アプリケーション実行
  app.run();
});
