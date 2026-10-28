/* ==========================================================
   请别在雨天离开 — 剧情数据（阶段 5：序章 ~ 第三章 + 结局）
   ----------------------------------------------------------
   场景结构：
   {
     id: 'pro_s01_intro',
     title: '序章 · 开学第一天',
     bg: 'bg_classroom',
     steps: [ ... ]
   }

   指令（t）：
   - bg          : { id }                         切换背景
   - narrate     : { text }                       旁白
   - say         : { who, text }                  对白（who 对应 characters）
   - choice      : { prompt, options:[{ text, effects:{trust,pressure}, set, goto }] }
   - timedChoice : { prompt, seconds, options:[...] }  超时执行 default 选项
   - observe     : { note, hotspot:{x,y,w,h}, hint }  观察点，坐标单位为百分比
   - phone       : { thread, messages:[{from,text}], replies:[{text,effects,set}] }
                   replies 留空数组 = 无需回复，玩家看完关闭短信即继续
                   messages 里 from:'system' = 系统提示（如“对方撤回了一条消息”）
   - goto        : { scene }
   - ending      : { }                            按当前数值与标记判定结局
   - end         : { text }                       直接结束（用于错误提示等）

   隐藏数值：trust（信任）/ pressure（压力），初始 4 / 2，范围 0–12。
   数值不显示在界面上，只能通过台词、短信与调试模式（按 D）观察。

   结局判定（script.js · resolveEnding）：
   - 坏结局 end_bad      : pressure >= 10 或 f_ch3_wrong
   - 真结局 end_true     : trust >= 10 且 pressure <= 6 且 观察点 >= 3
                           且 f_ch3_hospital 且 f_end_stay
   - 疏远结局 end_distant: 其余情况
   ========================================================== */

window.STORY = {
  title: '请别在雨天离开',
  startScene: 'pro_s01_intro',

  characters: {
    li:      { name: '李建', color: '#9fc4e8', portrait: 'assets/char/li.png',
               moods: { anxious: 'assets/char/li_anxious.png' } },
    lin:     { name: '林晚', color: '#e8b7c2', portrait: 'assets/char/lin.png',
               moods: { sad: 'assets/char/lin_sad.png', cry: 'assets/char/lin_cry.png', hope: 'assets/char/lin_hope.png' } },
    teacher: { name: '班主任', color: '#c9d6e2', portrait: 'assets/char/teacher.png' },
    mother:  { name: '林晚的母亲', color: '#c8b6a6', portrait: 'assets/char/mother.png' },
    doctor:  { name: '医生', color: '#c9d6e2', portrait: 'assets/char/doctor.png' }
  },

  backgrounds: {
    bg_classroom:       { src: 'assets/bg/classroom.jpg', label: '教室 · 开学第一天' },
    bg_gate_rain:       { src: 'assets/bg/gate_rain.jpg', label: '校门口 · 雨' },
    bg_old_school_rain: { src: 'assets/bg/old_school_rain.jpg', label: '旧教学楼后 · 雨' },
    bg_street_rain:     { src: 'assets/bg/street_rain.jpg', label: '回家的路 · 雨' },
    bg_room_night:      { src: 'assets/bg/room_night.jpg', label: '房间 · 夜' },
    bg_classroom_noon:  { src: 'assets/bg/classroom_noon.jpg', label: '教室 · 午休' },
    bg_gym:             { src: 'assets/bg/gym.jpg', label: '操场 · 体育课后' },
    bg_corridor:        { src: 'assets/bg/corridor.jpg', label: '教学楼走廊 · 家长会' },
    bg_apartment:       { src: 'assets/bg/apartment.jpg', label: '林晚家楼下 · 傍晚' },
    bg_room_dim:        { src: 'assets/bg/room_dim.jpg', label: '林晚的房间 · 傍晚' },
    bg_hospital:        { src: 'assets/bg/hospital.jpg', label: '医院 · 急诊室外' },
    bg_hospital_day:    { src: 'assets/bg/hospital_day.jpg', label: '医院 · 病房' }
  },

  notes: {
    note_pro_hairtie: {
      title: '笔记 · 黑色发圈',
      text: '她右手腕上套着一根黑色发圈，勒得很紧。旁边的皮肤被压出一圈浅浅的痕。她没有戴表，也没有戴别的东西。'
    },
    note_ch1_sorry: {
      title: '笔记 · 课本',
      text: '课本的空白处写满了“对不起”。字很小，一笔一画，像是写了很久。有几处被橡皮擦过，纸面起了毛。她发现我在看，很快把书合上了。'
    },
    note_ch2_mark: {
      title: '笔记 · 发圈下的旧痕',
      text: '发圈被拉下来的时候，她手腕内侧露出一小片皮肤。上面有几道很浅的旧痕，早就长好了，颜色比周围深一点，像褪色的线。她很快把袖子拉下去，动作熟练得让人不敢多问。'
    }
  },

  endings: [
    {
      id: 'end_true',
      name: '真结局《我会好好吃药》',
      title: '我会好好吃药',
      kicker: 'TRUE END · 真结局',
      hint: '有人留下来，也带她走出去。',
      cond: '信任 ≥ 10 · 压力 ≤ 6 · 观察点 ≥ 3 · 第三章陪她去医院 · 最后对她说「我在」',
      text: '她接受了专业的帮助。按时复诊，按时吃药，药很苦，她也没有再瞒着谁。发圈还套在她手腕上，只是不再用来遮什么。雨停的那天，我们一起走出医院，谁都没有提以后。',
      epilogue: '救赎不是一个人把另一个人拉出来，而是她愿意伸手时，有人在。'
    },
    {
      id: 'end_distant',
      name: '疏远结局《座位空了》',
      title: '座位空了',
      kicker: 'DISTANT END · 疏远结局',
      hint: '伞还了，人却远了。',
      cond: '未达成真结局，也没有滑向最坏的结果（压力 < 10 且未触发错误抉择）',
      text: '后来，林晚的座位一直空着。班主任说她转学了，也有人说她休学。李建发过很多条消息，都没有回。雨季结束的时候，他把伞收进柜子最里面。有些距离，不是一场雨造成的。',
      epilogue: '有些门，你错过了那一次伸手，就再也推不开了。'
    },
    {
      id: 'end_bad',
      name: '坏结局《雨没有停》',
      title: '雨没有停',
      kicker: 'BAD END · 坏结局',
      hint: '那扇门后面，雨一直没停。',
      cond: '压力 ≥ 10，或在第三章的倒计时里把她的求助转交给了别人',
      text: '那之后，李建没有再见过林晚。她的座位被挪到最后一排，后来连桌子也搬走了。他偶尔还会绕到那栋旧楼，站在楼下看一会儿。那扇门没有再开。雨也没有停。',
      epilogue: '那天他伸出手的时候迟疑了半秒。就是那半秒，她松了手。'
    }
  ],

  scenes: {
    /* ====================== 序章 ====================== */

    pro_s01_intro: {
      title: '序章 · 开学第一天',
      bg: 'bg_classroom',
      bgm: 'bgm_daily',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_classroom' },

        { t: 'narrate', text: '开学第一天，教室里有粉笔灰和潮气。' },
        { t: 'narrate', text: '风扇转得很慢，窗外的雨还没停。' },
        { t: 'narrate', text: '李建坐在靠窗第三排。名字被念到的时候，他站起来，又坐下。' },

        { t: 'say', who: 'teacher', text: '最后一位，林晚。' },
        { t: 'narrate', text: '最后一排的女生站起来。椅子腿在地上刮了一声。' },
        { t: 'say', who: 'lin', text: '林晚。' },
        { t: 'narrate', text: '她停了两秒，像在等谁接话。' },
        { t: 'say', who: 'lin', text: '[慢]……请多关照。' },

        { t: 'narrate', text: '她笑得很用力。嘴角扬得很高，眼睛却没有跟上。' },
        { t: 'narrate', text: '掌声稀稀拉拉。她坐下，把校服袖口往下拉了拉。' },

        { t: 'goto', scene: 'pro_s02_gate' }
      ]
    },

    pro_s02_gate: {
      title: '序章 · 放学后的雨',
      moods: { lin: 'sad' },
      bg: 'bg_gate_rain',
      bgm: 'bgm_sad',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_gate_rain' },

        { t: 'narrate', text: '放学的时候，雨反而大了。' },
        { t: 'narrate', text: '校门口挤满了伞。水顺着台阶往下淌。' },
        { t: 'narrate', text: '李建站在屋檐下，手里只有一把伞。' },
        { t: 'narrate', text: '林晚背着书包走出来。没有伞，也没有停。' },

        { t: 'say', who: 'li', text: '林晚。' },
        { t: 'say', who: 'lin', text: '嗯？' },
        { t: 'narrate', text: '她回头。雨水已经打湿了她的刘海。' },

        { t: 'say', who: 'li', text: '伞。你先拿着。' },
        { t: 'say', who: 'lin', text: '不用。' },
        { t: 'say', who: 'li', text: '我家近。' },
        { t: 'narrate', text: '他把伞往前递了递。' },
        { t: 'say', who: 'lin', text: '真的不用。' },

        { t: 'narrate', text: '她笑了一下。还是那种很用力的笑。' },
        { t: 'narrate', text: '她把书包顶在头上，走进雨里。没有回头。' },

        {
          t: 'inspect',
          text: '观察她被雨淋湿的肩膀',
          inspect: {
            id: 'insp_rain_shoulder',
            hotspotX: 38,
            hotspotY: 55,
            result: '她右肩的校服已经湿透了，布料紧贴着脊背，却好像她根本不觉得冷。'
          }
        },

        { t: 'goto', scene: 'pro_s03_oldschool' }
      ]
    },

    pro_s03_oldschool: {
      title: '序章 · 旧教学楼后',
      moods: { lin: 'sad' },
      bg: 'bg_old_school_rain',
      bgm: 'bgm_sad',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_old_school_rain' },

        { t: 'narrate', text: '李建没有走。' },
        { t: 'narrate', text: '他隔着一段距离，看见她拐进旧教学楼后面那条小路。' },
        { t: 'narrate', text: '那里没有灯。墙根堆着废弃的课桌，木头被雨泡得发黑。' },
        { t: 'narrate', text: '林晚蹲在台阶边，背对着他。校服湿透了，贴在背上。' },

        {
          t: 'observe',
          note: 'note_pro_hairtie',
          hotspot: { x: 44, y: 50, w: 28, h: 20 },
          hint: '她的右手腕上，套着一根黑色发圈。'
        },

        { t: 'say', who: 'li', text: '……林晚。' },
        { t: 'narrate', text: '她没有回头。肩膀轻轻抖了一下。' },
        { t: 'say', who: 'lin', text: '[抖]别过来。', shake: true },
        { t: 'say', who: 'li', text: '你怎么了。' },
        { t: 'say', who: 'lin', text: '没事。躲雨。' },

        { t: 'narrate', text: '她的声音很轻，被雨声压得很低。' },
        { t: 'say', who: 'lin', text: '你走吧。' },
        { t: 'say', who: 'lin', text: '[慢]反正……[停顿]都一样。' },
        { t: 'narrate', text: '雨越下越大。李建的鞋已经湿透了。', sfx: 'sfx_thunder' },

        {
          t: 'choice',
          prompt: '雨没有要停的意思。',
          options: [
            {
              text: '撑伞走过去',
              effects: { trust: 2, pressure: -1 },
              set: { f_pro_stayed: true },
              goto: 'pro_s04a_stay'
            },
            {
              text: '假装没看见，转身走',
              effects: { trust: -2, pressure: 2 },
              set: { f_pro_left: true },
              goto: 'pro_s04b_leave'
            }
          ]
        }
      ]
    },

    pro_s04a_stay: {
      title: '序章 · 伞下',
      bg: 'bg_old_school_rain',
      bgm: 'bgm_sad',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_old_school_rain' },

        { t: 'narrate', text: '李建撑开伞，走过去。' },
        { t: 'narrate', text: '伞太小，只够遮住一个人。他把伞举到她头顶。' },
        { t: 'narrate', text: '雨落在他的肩膀上，很快湿了一片。' },

        { t: 'say', who: 'lin', text: '……伞太小了。' },
        { t: 'say', who: 'li', text: '够。' },
        { t: 'narrate', text: '她没有再说话。' },

        { t: 'narrate', text: '过了很久，她站起来。腿有点麻，扶了一下墙。' },
        { t: 'say', who: 'lin', text: '……你干嘛。' },
        { t: 'say', who: 'li', text: '顺路。' },
        { t: 'say', who: 'lin', text: '你家不是这边。' },
        { t: 'say', who: 'li', text: '今天绕一下。' },

        { t: 'narrate', text: '她低头笑了一下。这次没那么用力。' },
        { t: 'say', who: 'lin', text: '……谢谢。' },
        { t: 'narrate', text: '他们一前一后走出旧教学楼。雨点在伞面上敲得很密。' },

        { t: 'goto', scene: 'pro_s05_night' }
      ]
    },

    pro_s04b_leave: {
      title: '序章 · 没回头',
      moods: { lin: 'sad' },
      bg: 'bg_street_rain',
      bgm: 'bgm_sad',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_street_rain' },

        { t: 'narrate', text: '李建转身，往回走。' },
        { t: 'narrate', text: '雨打在伞面上，声音很响。' },
        { t: 'narrate', text: '走到路口，他还是回了一次头。' },
        { t: 'narrate', text: '旧教学楼后面什么也看不见。只有雨。' },

        { t: 'narrate', text: '他站了一会儿。' },
        { t: 'narrate', text: '最后还是没有回去。' },

        { t: 'goto', scene: 'pro_s05_night' }
      ]
    },

    pro_s05_night: {
      title: '序章 · 十点',
      moods: { lin: 'sad' },
      bg: 'bg_room_night',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_room_night' },

        { t: 'narrate', text: '晚上十点，手机在桌上震了一下。' },
        { t: 'narrate', text: '屏幕亮起来。是林晚。' },

        {
          t: 'phone',
          thread: 'lin',
          messages: [
            { from: 'lin', text: '今天谢谢你。' },
            { from: 'system', text: '对方撤回了一条消息' }
          ],
          replies: []
        },

        { t: 'narrate', text: '对话框空了。' },
        { t: 'narrate', text: '像她从来没发过。' },
        { t: 'narrate', text: '李建把手机扣在桌上。雨还在下。' },

        { t: 'goto', scene: 'ch1_s01_seats' }
      ]
    },

    /* ====================== 第一章 ====================== */

    ch1_s01_seats: {
      title: '第一章 · 前后桌',
      bg: 'bg_classroom',
      bgm: 'bgm_daily',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_classroom' },

        { t: 'narrate', text: '第二天，雨停了。' },
        { t: 'narrate', text: '班主任调座位，把林晚换到李建前面。' },
        { t: 'narrate', text: '她搬书经过他桌边，纸箱挡住半张脸。' },

        { t: 'say', who: 'li', text: '要帮忙吗。' },
        { t: 'say', who: 'lin', text: '不用。' },

        { t: 'narrate', text: '她把书放下，喘了口气。' },
        { t: 'say', who: 'lin', text: '……谢谢。' },

        { t: 'narrate', text: '她坐下，背挺得很直。' },
        { t: 'narrate', text: '之后几天，他们只说过几句话。' },

        { t: 'say', who: 'lin', text: '借支笔。' },
        { t: 'say', who: 'li', text: '嗯。' },
        { t: 'narrate', text: '她用完了，会把笔帽扣好，放回他桌角。' },

        { t: 'goto', scene: 'ch1_s02_lunch' }
      ]
    },

    ch1_s02_lunch: {
      title: '第一章 · 午休',
      bg: 'bg_classroom_noon',
      bgm: 'bgm_daily',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_classroom_noon' },

        { t: 'narrate', text: '午休的时候，教室里只剩风扇的声音。' },
        { t: 'narrate', text: '林晚把饭盒打开，吃了两口，就合上了。' },
        { t: 'narrate', text: '她拿出语文课本，翻到最后几页。' },
        { t: 'narrate', text: '笔尖在纸上停了很久，没有落下。' },

        {
          t: 'inspect',
          text: '观察她课本扉页',
          inspect: {
            id: 'insp_textbook',
            hotspotX: 50,
            hotspotY: 70,
            result: '扉页右下角用铅笔写了一行极淡的小字：「对不起，我撑不住了。」'
          }
        },

        {
          t: 'observe',
          note: 'note_ch1_sorry',
          hotspot: { x: 34, y: 50, w: 34, h: 26 },
          hint: '摊开的课本上，写满了同一句话。'
        },

        { t: 'say', who: 'li', text: '你不吃了？' },
        { t: 'say', who: 'lin', text: '不太饿。' },
        { t: 'narrate', text: '她合上书，动作有点快。' },

        { t: 'say', who: 'li', text: '……是不是没睡好。' },
        { t: 'narrate', text: '林晚的手指停在书脊上。' },
        { t: 'say', who: 'lin', text: '为什么这么问。' },
        { t: 'narrate', text: '她没有看他。声音很平。' },

        {
          t: 'choice',
          prompt: '你要怎么说？',
          options: [
            {
              text: '继续追问：你最近是不是有心事',
              effects: { trust: 1, pressure: 2 },
              set: { f_ch1_pressed: true },
              goto: 'ch1_s03_sms'
            },
            {
              text: '换个轻松的话题',
              effects: { trust: 2, pressure: -1 },
              set: { f_ch1_light: true },
              goto: 'ch1_s03_sms'
            },
            {
              text: '沉默，装作没问过',
              effects: { trust: -1, pressure: 1 },
              set: { f_ch1_silent: true },
              goto: 'ch1_s03_sms'
            }
          ]
        }
      ]
    },

    ch1_s03_sms: {
      title: '第一章 · 熄灯前',
      moods: { lin: 'sad' },
      bg: 'bg_room_night',
      bgm: 'bgm_daily',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_room_night' },

        { t: 'narrate', text: '那天晚上，手机又亮了。' },
        { t: 'narrate', text: '林晚发来一条很短的消息。' },

        {
          t: 'phone',
          thread: 'lin',
          messages: [
            { from: 'lin', text: '你是不是觉得我很奇怪' }
          ],
          replies: [
            { text: '不奇怪。只是有点担心你。', effects: { trust: 2, pressure: -1 } },
            { text: '有一点。不过我不介意。', effects: { trust: -1, pressure: 2 } },
            { text: '你为什么会这么想。', effects: { trust: 1, pressure: 1 } }
          ]
        },

        { t: 'narrate', text: '她过了很久才回。' },
        { t: 'say', who: 'lin', text: '……知道了。' },
        { t: 'narrate', text: '然后就没有然后了。' },
        { t: 'narrate', text: '李建盯着屏幕，忽然觉得自己好像说错了什么。' },

        { t: 'goto', scene: 'ch2_s01_gym' }
      ]
    },

    /* ====================== 第二章 ====================== */

    ch2_s01_gym: {
      title: '第二章 · 发圈',
      bg: 'bg_gym',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_gym' },

        { t: 'narrate', text: '体育课结束，操场上的人陆续往教学楼走。' },
        { t: 'narrate', text: '林晚落在最后。' },
        { t: 'narrate', text: '她卷起校服袖子，手腕上套着那根黑色发圈。' },

        {
          t: 'observe',
          note: 'note_ch2_mark',
          hotspot: { x: 40, y: 46, w: 24, h: 22 },
          hint: '发圈被汗浸湿，往下滑了一点。'
        },

        { t: 'narrate', text: '李建看见了她手腕内侧。' },
        { t: 'narrate', text: '有几道很浅的旧痕，早就长好了。' },
        { t: 'narrate', text: '林晚察觉了他的目光。' },
        { t: 'narrate', text: '她把发圈往下拉，盖住那一小片皮肤。' },

        { t: 'say', who: 'lin', text: '看什么。' },
        { t: 'say', who: 'li', text: '……没什么。' },
        { t: 'narrate', text: '她笑了一下。' },
        { t: 'say', who: 'lin', text: '小时候摔的。' },
        { t: 'narrate', text: '她说得很轻松，像在说别人的事。' },
        { t: 'narrate', text: '李建没有立刻接话。风把操场上的沙吹起来一点。' },

        {
          t: 'choice',
          prompt: '你要说什么？',
          options: [
            {
              text: '说“我看到了”',
              effects: { trust: 2, pressure: 1 },
              set: { f_ch2_saw: true },
              goto: 'ch2_s02a_saw'
            },
            {
              text: '假装没看到',
              effects: { trust: -2, pressure: 2 },
              set: { f_ch2_ignore: true },
              goto: 'ch2_s02b_ignore'
            },
            {
              text: '只说“发圈挺好看”',
              effects: { trust: 1, pressure: -1 },
              set: { f_ch2_hairtie: true },
              goto: 'ch2_s02c_hairtie'
            }
          ]
        }
      ]
    },

    ch2_s02a_saw: {
      title: '第二章 · 我看到了',
      bg: 'bg_gym',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_gym' },

        { t: 'narrate', text: '“我看到了。”李建说。' },
        { t: 'narrate', text: '林晚的手停在袖口。' },
        { t: 'say', who: 'lin', text: '看到什么。' },
        { t: 'say', who: 'li', text: '你的手腕。' },

        { t: 'narrate', text: '她沉默了一会儿。' },
        { t: 'say', who: 'lin', text: '……哦。' },
        { t: 'narrate', text: '她没有生气，也没有解释。' },
        { t: 'narrate', text: '只是把袖口又往下拉了拉。' },

        { t: 'say', who: 'lin', text: '别跟别人说。' },
        { t: 'say', who: 'li', text: '嗯。' },
        { t: 'narrate', text: '两个人往教学楼走。她走在前面，脚步比平时慢。' },

        { t: 'goto', scene: 'ch2_s03_corridor' }
      ]
    },

    ch2_s02b_ignore: {
      title: '第二章 · 移开视线',
      bg: 'bg_gym',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_gym' },

        { t: 'narrate', text: '李建把视线移开。' },
        { t: 'narrate', text: '他假装在看操场边那排树。' },
        { t: 'narrate', text: '林晚把发圈拉好，站起来。' },

        { t: 'say', who: 'lin', text: '走吧。' },
        { t: 'say', who: 'li', text: '嗯。' },

        { t: 'narrate', text: '一路上，她走在前面，没有回头。' },
        { t: 'narrate', text: '那句“小时候摔的”，谁都没有再提。' },

        { t: 'goto', scene: 'ch2_s03_corridor' }
      ]
    },

    ch2_s02c_hairtie: {
      title: '第二章 · 发圈挺好看',
      bg: 'bg_gym',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_gym' },

        { t: 'narrate', text: '“发圈挺好看。”李建说。' },
        { t: 'narrate', text: '林晚愣了一下。' },
        { t: 'say', who: 'lin', text: '……这个？' },
        { t: 'say', who: 'li', text: '嗯。黑色的，简单。' },

        { t: 'narrate', text: '她低头看了看手腕。' },
        { t: 'narrate', text: '嘴角动了一下，不算笑。' },
        { t: 'say', who: 'lin', text: '两块钱一包。' },
        { t: 'say', who: 'li', text: '那挺值。' },

        { t: 'narrate', text: '她没有再把发圈往下拉。' },
        { t: 'narrate', text: '两个人往回走，谁都没有提那一小片皮肤。' },

        { t: 'goto', scene: 'ch2_s03_corridor' }
      ]
    },

    ch2_s03_corridor: {
      veil: true,
      title: '第二章 · 家长会',
      moods: { lin: 'sad' },
      bg: 'bg_corridor',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_corridor' },

        { t: 'narrate', text: '下午家长会，走廊里站满了人。' },
        { t: 'narrate', text: '李建去办公室交作业，回来时听见有人在说话。' },
        { t: 'narrate', text: '是林晚的母亲。她站在窗边，声音不大，但很清楚。' },

        { t: 'say', who: 'mother', text: '……她就是矫情。' },
        { t: 'say', who: 'mother', text: '别人家孩子怎么没事。' },
        { t: 'say', who: 'mother', text: '老师，你别太顺着她。' },

        { t: 'narrate', text: '班主任说了什么，李建没听清。' },
        { t: 'narrate', text: '他站在拐角，手里的作业本被捏出了褶。' },
        { t: 'narrate', text: '走廊另一头，林晚靠着墙站着。' },
        { t: 'narrate', text: '她应该也听见了。' },

        { t: 'narrate', text: '她看见李建，先笑了一下。' },
        { t: 'say', who: 'lin', text: '你也来交作业？' },
        { t: 'narrate', text: '好像刚才那几句话，跟她没有关系。' },

        {
          t: 'choice',
          prompt: '你要怎么做？',
          options: [
            {
              text: '当场替她说话',
              effects: { trust: 2, pressure: 1 },
              set: { f_ch2_stand: true },
              goto: 'ch2_s04a_stand'
            },
            {
              text: '事后陪她走',
              effects: { trust: 2, pressure: -2 },
              set: { f_ch2_walk: true },
              goto: 'ch2_s04b_walk'
            },
            {
              text: '什么都不说',
              effects: { trust: -2, pressure: 2 },
              set: { f_ch2_silent: true },
              goto: 'ch2_s04c_silent'
            }
          ]
        }
      ]
    },

    ch2_s04a_stand: {
      title: '第二章 · 走廊里',
      moods: { lin: 'sad' },
      bg: 'bg_corridor',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_corridor' },

        { t: 'narrate', text: '李建往前走了两步。' },
        { t: 'say', who: 'li', text: '阿姨。' },
        { t: 'narrate', text: '她母亲回过头。' },
        { t: 'say', who: 'li', text: '她不是矫情。' },

        { t: 'narrate', text: '走廊里安静了一下。' },
        { t: 'say', who: 'mother', text: '你是哪家的孩子。' },
        { t: 'say', who: 'li', text: '她同学。' },
        { t: 'narrate', text: '他也不知道自己哪来的胆子。' },

        { t: 'narrate', text: '林晚站在他身后，拉了一下他的袖子。' },
        { t: 'say', who: 'lin', text: '[抖]别说了。', shake: true },
        { t: 'narrate', text: '她母亲看了他们一会儿，转身进了教室。' },
        { t: 'narrate', text: '林晚没有跟上去。' },

        { t: 'say', who: 'lin', text: '……你干嘛。' },
        { t: 'say', who: 'li', text: '没干嘛。' },
        { t: 'narrate', text: '她低着头，很久没说话。' },

        { t: 'goto', scene: 'ch2_s05_night' }
      ]
    },

    ch2_s04b_walk: {
      title: '第二章 · 一起走',
      moods: { lin: 'sad' },
      bg: 'bg_corridor',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_corridor' },

        { t: 'narrate', text: '李建没有过去。' },
        { t: 'narrate', text: '他等在楼梯口。' },
        { t: 'narrate', text: '家长会散的时候，林晚一个人下来。' },
        { t: 'narrate', text: '书包带子很长，垂到腿边。' },

        { t: 'say', who: 'li', text: '一起走？' },
        { t: 'narrate', text: '她看了他一眼。' },
        { t: 'say', who: 'lin', text: '你不是这个方向。' },
        { t: 'say', who: 'li', text: '今天绕一下。' },

        { t: 'narrate', text: '她没说什么，往前走了。' },
        { t: 'narrate', text: '李建跟上去。' },
        { t: 'narrate', text: '两个人走了一段，她才开口。' },
        { t: 'say', who: 'lin', text: '我妈说话，你别当真。' },

        { t: 'say', who: 'li', text: '嗯。' },
        { t: 'say', who: 'lin', text: '……她也不容易。' },
        { t: 'narrate', text: '说完这句，她就不再说话了。' },

        { t: 'goto', scene: 'ch2_s05_night' }
      ]
    },

    ch2_s04c_silent: {
      title: '第二章 · 什么都没说',
      moods: { lin: 'sad' },
      bg: 'bg_corridor',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_corridor' },

        { t: 'narrate', text: '李建没有动。' },
        { t: 'narrate', text: '他看着她笑，看着她说“你也来交作业”。' },
        { t: 'narrate', text: '然后他点了点头，从她身边走过去。' },
        { t: 'say', who: 'lin', text: '……嗯。' },

        { t: 'narrate', text: '身后没有别的声音。' },
        { t: 'narrate', text: '走出教学楼的时候，他回头看了一眼。' },
        { t: 'narrate', text: '林晚还站在走廊里，靠着墙。' },
        { t: 'narrate', text: '她低着头，在整理书包带子。' },

        { t: 'goto', scene: 'ch2_s05_night' }
      ]
    },

    ch2_s05_night: {
      title: '第二章 · 很难受',
      moods: { lin: 'cry' },
      bg: 'bg_room_night',
      bgm: 'bgm_sad',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_room_night' },

        { t: 'narrate', text: '晚上，手机亮了。' },
        { t: 'narrate', text: '林晚发来一条消息。' },

        {
          t: 'phone',
          thread: 'lin',
          messages: [
            { from: 'lin', text: '我有时候真的很难受' }
          ],
          replies: [
            { text: '我知道。你不用一个人扛。', effects: { trust: 2, pressure: -2 } },
            { text: '难受的话，去看看医生会不会好一点。', effects: { trust: 1, pressure: 1 } },
            { text: '别想太多，睡一觉就好了。', effects: { trust: -2, pressure: 2 } }
          ]
        },

        { t: 'narrate', text: '她过了很久才回。' },
        { t: 'narrate', text: '只有一个字。' },
        { t: 'say', who: 'lin', text: '嗯。' },

        { t: 'narrate', text: '李建盯着那个字看了很久。' },
        { t: 'narrate', text: '窗外的雨又开始了。' },

        { t: 'goto', scene: 'ch3_s01_absent' }
      ]
    },

    /* ====================== 第三章 ====================== */

    ch3_s01_absent: {
      title: '第三章 · 缺席',
      moods: { li: 'anxious' },
      bg: 'bg_classroom',
      bgm: 'bgm_tense',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_classroom' },

        { t: 'narrate', text: '第二天，林晚没来。' },
        { t: 'narrate', text: '她的座位空着，桌肚里还放着昨天没带走的伞。' },
        { t: 'narrate', text: '班主任点名，念到她的名字，停了一下。' },
        { t: 'say', who: 'teacher', text: '林晚，请假。' },

        { t: 'narrate', text: '李建拿出手机。' },
        { t: 'narrate', text: '消息发出去，没有回。' },
        { t: 'narrate', text: '中午他又打了一次。' },
        { t: 'narrate', text: '电话响到自动挂断。' },
        { t: 'narrate', text: '下午放学，他去了她家。' },

        { t: 'goto', scene: 'ch3_s02_home' }
      ]
    },

    ch3_s02_home: {
      title: '第三章 · 敲门',
      moods: { li: 'anxious' },
      bg: 'bg_apartment',
      bgm: 'bgm_tense',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_apartment' },

        { t: 'narrate', text: '她家在一栋旧楼的三层。' },
        { t: 'narrate', text: '楼道里没有灯，墙皮翘起来。' },
        { t: 'narrate', text: '李建敲门。', sfx: 'sfx_door' },
        { t: 'narrate', text: '敲了很久，门才开了一条缝。' },

        { t: 'say', who: 'mother', text: '你是谁。' },
        { t: 'say', who: 'li', text: '林晚的同学。她今天没来。' },
        { t: 'say', who: 'mother', text: '她不舒服，睡了。' },
        { t: 'narrate', text: '门要关上了。' },

        { t: 'narrate', text: '李建伸手抵住门。' },
        { t: 'say', who: 'li', text: '阿姨，让我看一眼。' },
        { t: 'say', who: 'mother', text: '不用看。' },
        { t: 'say', who: 'li', text: '就一眼。' },

        { t: 'narrate', text: '他站在门口，没有让开。' },
        { t: 'narrate', text: '两个人隔着门缝僵了几秒。' },
        { t: 'narrate', text: '门里的房间很安静。' },
        { t: 'narrate', text: '安静得不对劲。' },

        { t: 'say', who: 'li', text: '阿姨。' },
        { t: 'narrate', text: '他的声音有点抖，但没有退。' },
        { t: 'say', who: 'li', text: '[停顿][慢]求你了。' },
        { t: 'narrate', text: '门开了。' },

        { t: 'goto', scene: 'ch3_s02b_room' }
      ]
    },

    ch3_s02b_room: {
      title: '第三章 · 房间',
      moods: { lin: 'cry', li: 'anxious' },
      bg: 'bg_room_dim',
      bgm: 'bgm_tense',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_room_dim' },

        { t: 'narrate', text: '房间里拉着窗帘。' },
        { t: 'narrate', text: '林晚坐在床边，背靠着墙。' },
        { t: 'narrate', text: '她的脸很白，嘴唇也没有颜色。' },
        { t: 'narrate', text: '长袖校服穿得很整齐。' },
        { t: 'narrate', text: '她看见李建，愣了一下。' },

        { t: 'say', who: 'lin', text: '……你怎么来了。' },
        { t: 'say', who: 'li', text: '你没来上学。' },
        { t: 'say', who: 'lin', text: '我请假了。' },
        { t: 'narrate', text: '她说话很轻，像是没什么力气。' },

        { t: 'narrate', text: '李建看见床头柜上的水杯。' },
        { t: 'narrate', text: '水是满的，没动过。' },
        { t: 'narrate', text: '她母亲站在门口，没有说话。' },

        { t: 'say', who: 'lin', text: '[慢]你回去吧。' },
        { t: 'narrate', text: '李建没有动。' },
        { t: 'narrate', text: '他忽然很怕。' },
        { t: 'narrate', text: '怕自己一走，这个房间就再也没有声音。' },

        {
          t: 'timedChoice',
          prompt: '她让你回去。你只有几秒钟。',
          seconds: 5,
          options: [
            {
              text: '陪她去医院',
              effects: { trust: 2, pressure: -2 },
              set: { f_ch3_hospital: true },
              goto: 'ch3_s03a_hospital'
            },
            {
              text: '先告诉她母亲严重性',
              effects: { trust: 0, pressure: 1 },
              set: { f_ch3_mother: true },
              default: true,
              goto: 'ch3_s03b_mother'
            },
            {
              text: '打电话给班主任',
              effects: { trust: -2, pressure: 2 },
              set: { f_ch3_teacher: true, f_ch3_wrong: true },
              goto: 'ch3_s03c_teacher'
            }
          ]
        }
      ]
    },

    ch3_s03a_hospital: {
      title: '第三章 · 去医院',
      moods: { lin: 'cry', li: 'anxious' },
      bg: 'bg_room_dim',
      bgm: 'bgm_tense',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_room_dim' },

        { t: 'narrate', text: '“去医院。”李建说。' },
        { t: 'say', who: 'lin', text: '不用。' },
        { t: 'say', who: 'li', text: '去。' },

        { t: 'narrate', text: '他走过去，扶住她的胳膊。' },
        { t: 'narrate', text: '她很轻，站起来的时候晃了一下。' },
        { t: 'say', who: 'mother', text: '……你们干什么。' },
        { t: 'say', who: 'li', text: '阿姨，她得去医院。' },

        { t: 'narrate', text: '母亲看了看林晚的脸，终于拿起外套。' },
        { t: 'narrate', text: '下楼的时候，李建一直扶着她。' },

        { t: 'goto', scene: 'ch3_s04_er' }
      ]
    },

    ch3_s03b_mother: {
      title: '第三章 · 告诉她母亲',
      moods: { li: 'anxious' },
      bg: 'bg_room_dim',
      bgm: 'bgm_tense',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_room_dim' },

        { t: 'narrate', text: '李建转过身。' },
        { t: 'say', who: 'li', text: '阿姨，她不对劲。' },
        { t: 'say', who: 'mother', text: '她就是不想上学。' },
        { t: 'say', who: 'li', text: '不是。你看看她。' },

        { t: 'narrate', text: '母亲皱起眉，走进房间。' },
        { t: 'narrate', text: '她看了林晚一会儿。' },
        { t: 'narrate', text: '脸上的表情慢慢变了。' },
        { t: 'say', who: 'mother', text: '[抖]……晚晚？' },

        { t: 'narrate', text: '林晚没有回答。' },
        { t: 'narrate', text: '母亲的手开始抖。' },
        { t: 'narrate', text: '她抓起手机，又放下，最后去拿外套。' },

        { t: 'say', who: 'li', text: '我陪你们去。' },
        { t: 'narrate', text: '没有人反对。' },

        { t: 'goto', scene: 'ch3_s04_er' }
      ]
    },

    ch3_s03c_teacher: {
      title: '第三章 · 打给班主任',
      moods: { lin: 'cry', li: 'anxious' },
      bg: 'bg_room_dim',
      bgm: 'bgm_tense',
      ambient: 'ambient_rain',
      steps: [
        { t: 'bg', id: 'bg_room_dim' },

        { t: 'narrate', text: '李建拿出手机，拨了班主任的电话。' },
        { t: 'say', who: 'li', text: '老师，林晚不太对劲。' },
        { t: 'narrate', text: '他把地址说了一遍。' },
        { t: 'narrate', text: '班主任让他先别动，说马上联系家长。' },

        { t: 'narrate', text: '电话挂了。' },
        { t: 'narrate', text: '房间里的时间变得很慢。' },
        { t: 'say', who: 'lin', text: '……你打给谁了。' },
        { t: 'say', who: 'li', text: '老师。' },

        { t: 'narrate', text: '林晚看着他，眼神一点点暗下去。' },
        { t: 'say', who: 'lin', text: '[慢]为什么[停顿]要告诉别人。' },
        { t: 'narrate', text: '她母亲在门口接电话，声音很大。' },

        { t: 'narrate', text: '李建站在原地，忽然不知道自己该做什么。' },
        { t: 'narrate', text: '等班主任赶到，已经是半个小时后。' },
        { t: 'narrate', text: '这半个小时里，林晚一句话都没说。' },

        { t: 'goto', scene: 'ch3_s04_er' }
      ]
    },

    ch3_s04_er: {
      veil: true,
      title: '第三章 · 急诊室外',
      moods: { lin: 'cry', li: 'anxious' },
      bg: 'bg_hospital',
      bgm: 'bgm_tense',
      ambient: 'ambient_hospital',
      steps: [
        { t: 'bg', id: 'bg_hospital' },
        { t: 'narrate', text: '急诊室的灯很白。', sfx: 'sfx_beep' },
        { t: 'narrate', text: '推床进去的时候，李建被拦在门外。' },
        { t: 'narrate', text: '门上的灯亮着。' },
        { t: 'narrate', text: '他坐在走廊的塑料椅上。' },

        { t: 'narrate', text: '手心里全是汗。' },
        { t: 'narrate', text: '过了很久，他才发现自己一直在抖。' },
        { t: 'narrate', text: '[停顿]然后眼泪就下来了。' },
        { t: 'narrate', text: '他低着头，没有出声。' },
        { t: 'narrate', text: '这是他第一次在医院走廊里哭。' },

        { t: 'narrate', text: '母亲坐在另一头，脸埋在手里。' },
        { t: 'narrate', text: '没有人说话。' },

        { t: 'narrate', text: '不知道过了多久，医生出来。' },
        { t: 'say', who: 'doctor', text: '她现在已经稳定了。' },
        { t: 'say', who: 'doctor', text: '需要留院观察。' },
        { t: 'say', who: 'doctor', text: '家属跟我来一下。' },

        { t: 'narrate', text: '母亲站起来，跟着医生走了。' },
        { t: 'narrate', text: '李建留在原地。' },
        { t: 'narrate', text: '走廊尽头的窗外，天已经黑透了。' },
        { t: 'narrate', text: '雨还在下。' },

        {
          t: 'qte',
          prompt: '医生的背影要消失了，要跟上去吗？',
          seconds: 5,
          qte: {
            time: 5,
            options: [
              {
                text: '立刻跟上，问问她的情况',
                effects: { trust: 1, pressure: -1 },
                goto: 'ch3_s05_ward'
              },
              {
                text: '等她母亲先跟医生谈完',
                effects: { trust: -1, pressure: 2 },
                default: true,
                goto: 'end_bad'
              }
            ]
          }
        },

        { t: 'goto', scene: 'ch3_s05_ward' }
      ]
    },

    ch3_s05_ward: {
      title: '第三章 · 病房',
      moods: { lin: 'sad' },
      bg: 'bg_hospital_day',
      bgm: 'bgm_sad',
      ambient: 'ambient_hospital',
      steps: [
        { t: 'bg', id: 'bg_hospital_day' },

        { t: 'narrate', text: '第二天下午，李建去看她。' },
        { t: 'narrate', text: '病房里有三张床，只有她这一床有人。' },
        { t: 'narrate', text: '林晚靠在床头，手背上贴着胶布。' },
        { t: 'narrate', text: '她看见他，想坐起来，又没力气。' },

        { t: 'say', who: 'li', text: '别动。' },
        { t: 'say', who: 'lin', text: '……你昨天哭了。' },
        { t: 'narrate', text: '李建一愣。' },
        { t: 'say', who: 'li', text: '没有。' },
        { t: 'say', who: 'lin', text: '我听见了。' },

        { t: 'narrate', text: '她说得很轻，但没有笑他的意思。' },
        { t: 'narrate', text: '窗外天气很好。' },
        { t: 'narrate', text: '雨停了。' },
        { t: 'narrate', text: '两个人安静了一会儿。' },

        { t: 'say', who: 'lin', text: '李建。' },
        { t: 'say', who: 'li', text: '嗯。' },
        { t: 'say', who: 'lin', text: '[慢]谢谢你。' },
        { t: 'narrate', text: '她说完，把头转向窗户。' },
        { t: 'narrate', text: '有些话，再不说就说不出口了。' },

        {
          t: 'choice',
          prompt: '你要说什么？',
          options: [
            {
              text: '告诉她，你喜欢她',
              effects: { trust: 1, pressure: 1 },
              set: { f_end_confess: true },
              goto: 'ch3_s06a_confess'
            },
            {
              text: '只说“我在”',
              effects: { trust: 1, pressure: -2 },
              set: { f_end_stay: true },
              goto: 'ch3_s06b_stay'
            },
            {
              text: '什么都不说',
              effects: { trust: -1, pressure: 2 },
              set: { f_end_silent: true },
              goto: 'ch3_s06c_silent'
            }
          ]
        }
      ]
    },

    ch3_s06a_confess: {
      title: '第三章 · 喜欢',
      moods: { lin: 'hope' },
      bg: 'bg_hospital_day',
      bgm: 'bgm_hope',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_hospital_day' },

        { t: 'say', who: 'li', text: '[停顿]林晚，[停顿]我喜欢你。' },
        { t: 'narrate', text: '她转过来，看着他。' },
        { t: 'say', who: 'lin', text: '……现在说这个。' },
        { t: 'say', who: 'li', text: '现在不说，我怕以后没机会。' },

        { t: 'narrate', text: '她低下头，手指捏着被角。' },
        { t: 'say', who: 'lin', text: '[慢]我不一定好得起来。' },
        { t: 'say', who: 'li', text: '那就慢慢来。' },

        { t: 'narrate', text: '她没有答应，也没有拒绝。' },
        { t: 'narrate', text: '只是把被子往上拉了拉，盖住半张脸。' },

        { t: 'goto', scene: 'ch3_s07_sms' }
      ]
    },

    ch3_s06b_stay: {
      title: '第三章 · 我在',
      moods: { lin: 'hope' },
      bg: 'bg_hospital_day',
      bgm: 'bgm_hope',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_hospital_day' },

        { t: 'say', who: 'li', text: '我在。' },
        { t: 'narrate', text: '只有两个字。' },
        { t: 'narrate', text: '林晚看着他。' },
        { t: 'say', who: 'lin', text: '……嗯。' },

        { t: 'narrate', text: '她把脸转向窗户。' },
        { t: 'narrate', text: '过了一会儿，她说：' },
        { t: 'say', who: 'lin', text: '你明天还来吗。' },
        { t: 'say', who: 'li', text: '来。' },

        { t: 'narrate', text: '她没有再说话。' },
        { t: 'narrate', text: '但肩膀松下来了一点。' },

        { t: 'goto', scene: 'ch3_s07_sms' }
      ]
    },

    ch3_s06c_silent: {
      title: '第三章 · 没说出口',
      moods: { lin: 'sad' },
      bg: 'bg_hospital_day',
      bgm: 'bgm_sad',
      ambient: 'ambient_hospital',
      steps: [
        { t: 'bg', id: 'bg_hospital_day' },

        { t: 'narrate', text: '李建什么也没说。' },
        { t: 'narrate', text: '他坐了一会儿，站起来。' },
        { t: 'say', who: 'li', text: '我先回去了。' },
        { t: 'say', who: 'lin', text: '嗯。' },

        { t: 'narrate', text: '走到门口，他回头。' },
        { t: 'narrate', text: '林晚正看着窗外。' },
        { t: 'narrate', text: '没有看他。' },
        { t: 'narrate', text: '门关上的时候，走廊很安静。' },

        { t: 'goto', scene: 'ch3_s07_sms' }
      ]
    },

    ch3_s07_sms: {
      title: '第三章 · 天气不错',
      moods: { lin: 'hope' },
      bg: 'bg_hospital_day',
      bgm: 'bgm_hope',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_hospital_day' },

        { t: 'narrate', text: '晚上，手机又亮了。' },
        { t: 'narrate', text: '是林晚。' },

        {
          t: 'phone',
          thread: 'lin',
          messages: [
            { from: 'lin', text: '药有点苦。但今天天气不错。' }
          ],
          replies: []
        },

        { t: 'narrate', text: '李建看着那条消息，看了很久。' },
        { t: 'narrate', text: '窗外没有雨。' },

        { t: 'ending' }
      ]
    },

    /* ====================== 二周目彩蛋 ====================== */
    /* 通关任一结局后，从标题页「回忆 · 那个雨天之前」进入。
       不写自动存档，不影响主线进度。 */

    extra_s01_memory: {
      title: '回忆 · 初中三年级',
      bg: 'bg_classroom',
      bgm: 'bgm_daily',
      ambient: 'ambient_room',
      steps: [
        { t: 'bg', id: 'bg_classroom' },

        { t: 'narrate', text: '初中三年级的春天，还没有这场雨。' },
        { t: 'narrate', text: '李建是图书角的管理员。每周三放学后，他负责把还回来的书摆上架子。' },
        { t: 'narrate', text: '有一次，他在一本画册里发现一张夹着的书签。' },
        { t: 'narrate', text: '书签是手工做的，压得平平整整，上面画着一把很小的伞。' },
        { t: 'narrate', text: '伞下面写着一行字：「希望下雨天，也有人记得带伞。」' },

        { t: 'say', who: 'li', text: '……谁落在这儿的。' },
        { t: 'narrate', text: '他把书签交去了失物招领处。' },
        { t: 'narrate', text: '第二天，书签不见了。大概是被主人领走了。' },
        { t: 'narrate', text: '那之后，他再没见过那张书签。' },

        { t: 'narrate', text: '[停顿]直到高中开学第一天。' },
        { t: 'narrate', text: '最后一排的女生站起来，说她叫林晚。' },
        { t: 'narrate', text: '她的课本角上，画着一把很小的伞。' },

        { t: 'say', who: 'lin', text: '……你看什么。' },
        { t: 'say', who: 'li', text: '没什么。' },
        { t: 'narrate', text: '他低下了头。窗外阳光很好。' },
        { t: 'narrate', text: '那一年，他们十五岁。' },
        { t: 'narrate', text: '[慢]那时候他还不知道，有些话，要用很久才能说出口。' },

        { t: 'end', text: '—— 回忆 · 完 ——' }
      ]
    }
  }
};
