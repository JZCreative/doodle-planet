import {CHARACTER_NAMES} from './character-stories.js?v=3';
const words={
 '的正方形头像':"'s square avatar",'的3D角色预览':" — 3D preview",'张赢作品集中的艺术家与作品现场照片':'Zhang Ying with his artwork','给怪可爱的宇宙上色':'Color a wonderfully odd universe','奇思妙想，慢慢漂':'Let your imagination drift','拖动环绕 · 悬停让朋友停一停 · 点击开始填色':'Drag to orbit · Hover to pause a friend · Click to color','轻轻相碰，换个方向再出发':'A gentle bump, a new direction','正在叫醒宇宙居民…':'Waking up the universe…','完成一件作品，任选一位新朋友 · 3 个分区或 3 笔即可完成':'Finish an artwork to invite a friend · Fill 3 regions or paint 3 strokes',
 '无法读取存档，请检查浏览器是否允许本机存储。':'Could not read saved designs. Check that local storage is allowed.','本机存储不可用，暂不能保存':'Local storage unavailable. Saving is disabled.','进度读取失败，请刷新后重试':'Could not load progress. Please refresh.','模型版本已变更，保留旧记录但不能直接套用':'Model updated. Your old design is kept but cannot be applied directly.','部分角色版本已变更，原记录仍保留':'Some models have changed. Your original record is kept.','此角色尚未解锁，请先完成一件作品':'This character is locked. Finish an artwork first.','尚未解锁，请先完成已开放的作品':'is locked. Finish an available artwork first.','完成作品，在旅行手册中选择新朋友':'Finish an artwork and choose a new friend in the journal','清空失败，未更改画面。请检查本机存储后重试。':'Reset failed. Nothing was changed. Check local storage and retry.','作品已完成！去旅行手册选择新朋友':'Artwork complete! Choose a new friend in the journal.','保存失败，未扣除或发放进度，请重试':'Save failed. Progress is unchanged. Please retry.',
 '刷子：在角色上拖动涂色，拖动空白处旋转（或按住 Alt 拖动）。':'Brush: drag on the character to paint. Drag empty space (or Alt-drag) to rotate.',
 '已撤销上一步':'Last action undone','点击角色泼出颜料，拖动旋转。':'Click a character to splash paint. Drag to rotate.','点击区域填色，拖动旋转。':'Click a region to fill. Drag to rotate.','轻轻的':'Light','很有脾气':'Bold','画布笔迹已满，恢复纯白后可重新创作。':'The canvas is full. Reset to white to start again.','正在飞向':'Flying to ','点击一个朋友，飞近一点':'Click a friend to fly closer','点击星空里的朋友，飞近一点':'Click a friend in the stars to fly closer','位居民已醒来':'friends are awake','部分居民加载失败，请刷新重试':'Some characters could not load. Please refresh.','加载失败':'Load failed','整组已保存':'Group saved','保存失败，请重试':'Save failed. Please try again.',
 '涂色 3 个分区，或完成 3 笔涂鸦':'Fill 3 regions or make 3 brush strokes','完成一位朋友的作品，就能从三个新邻居中任选一位。邀请机会可以留到下次。':'Finish a friend’s artwork to invite one of three new neighbors. You can save your invitation for later.','邀请这位朋友':'Invite this friend','看看其他朋友':'Meet other friends','开始给它涂色':'Start coloring','角色正在赶来…':'Your friend is on the way…','角色暂未加载，请关闭手册后重试':'Character not loaded. Close the journal and try again.','目前没有可用的邀请机会。':'No invitations available yet.','作品完成，头像已收藏。':'Artwork complete. Avatar saved.','头像未能保存，请回到填色页重试。作品进度不受影响。':'Avatar could not be saved. Try again in the studio. Your artwork is safe.','手册读取失败，请检查浏览器存储空间。':'Could not load the journal. Check browser storage.','贴纸未能保存，请重试':'Sticker could not be saved. Please try again.','保存失败，请再次调整以重试':'Save failed. Adjust again to retry.',
 '关闭艺术家介绍':'Close artist introduction','关闭旅行手册':'Close journal','关闭设计记录':'Close saved designs','填色工具':'Coloring tools','已为「':'Colored: ','」上色':'','身体与四肢':'Body and limbs','头部':'Head','颈圈':'Neck ring','眼白':'Eye','瞳孔':'Pupil','嘴巴':'Mouth','身体':'Body','左':'Left ','右':'Right ',
 '中文 / EN':'中文 / EN',
 '旅行手册':'Travel journal','宇宙旅行手册':'Universe journal','设计记录':'Saved designs','关于艺术家':'About the artist','回到宇宙':'Back to universe','恢复初始视角':'Reset view','漂浮':'Float',
 '宇宙合照':'Universe portrait','重置宇宙':'Reset universe','回到中央':'Recenter','暂停漂浮':'Pause motion','继续漂浮':'Resume motion','今天涂谁？':'Who will you color?',
 '乱涂工具箱':'Color kit','怎么玩？':'Choose a tool','区域填色':'Fill','为相连的表面上色':'Color a connected region','泼一泼':'Splash','不规则墨斑与细小飞点':'Playful splashes and tiny droplets','刷子':'Brush','按住拖动，连续涂刷':'Press and drag to paint','笔刷大小':'Brush size','抓一支颜色':'Pick a color','柔和色':'Soft colors','线条脾气':'Line weight','刚刚好':'Just right','撤销上一步':'Undo','恢复纯白':'Reset to white','生成头像':'Create avatar','保存设计版本':'Save design','保存整组设计':'Save group design','创作进度':'Progress','角色的口头禅':'Character inspiration',
 '番茄红':'Tomato red','太阳黄':'Sunshine yellow','薄荷绿':'Mint green','月亮蓝':'Moon blue','怪梦紫':'Dream purple','留白':'White','红':'Red','黄':'Yellow','绿':'Green','蓝':'Blue','紫':'Purple','桃花粉':'Peach pink','杏子橙':'Apricot','奶油黄':'Cream','湖水青':'Aqua','雾气紫':'Lilac','可可棕':'Cocoa','桃粉':'Peach','杏橙':'Apricot','奶黄':'Cream','湖青':'Aqua','雾紫':'Lilac','可可':'Cocoa',
 '存档保存在当前浏览器，不跨设备同步':'Designs are stored in this browser, not synced across devices.',
 '自动续画保留每个角色的最新进度；“保存设计版本”可保留多个创作阶段。':'Autosave keeps your latest progress. Save design keeps additional versions.',
 '记录仅保存在本机当前浏览器，清除网站数据会移除记录。':'Saved locally in this browser. Clearing site data removes your designs.',
 '还没有记录，开始涂鸦后会自动保存。':'No designs yet. Start coloring to autosave your progress.',
 '所有朋友都已来到宇宙，继续给他们设计新配色吧。':'All your friends are here. Keep exploring new colors for them!',
 '下一站，认识谁？':'Who will you meet next?','我的头像':'My avatars','选个贴纸，下载正方形头像。仅保存在当前浏览器。':'Choose a sticker and download a square avatar. Saved in this browser.',
 '在填色页点击「生成头像」，把喜欢的角度留下来。':'Select Create avatar in the studio to capture your favorite view.',
 '无贴纸':'No sticker','选择头像贴纸':'Choose a sticker','下载头像':'Download avatar','再画一版':'Color again','拖动贴纸移动位置':'Drag the sticker to move it','贴纸缩放':'Sticker size','贴纸旋转':'Sticker rotation','贴纸文字':'Sticker text','缩放':'Size','旋转':'Rotation','文字':'Text','自定义文字':'Your text','头像编辑已保存':'Avatar edits saved','贴纸已保存':'Sticker saved','选一枚贴纸，带走你的头像。':'Pick a sticker and take your avatar with you.',
 '让宇宙重新留白？':'Give the universe a fresh start?',
 '这会清空所有角色的填色、涂鸦、自动续画和设计存档，且无法撤销。':'This permanently clears all character colors, brushwork, autosaves and saved designs. This cannot be undone.',
 '已解锁角色、完成进度和已生成的头像会保留。':'Unlocked characters, completion progress and avatars will be kept.',
 '所有角色已恢复空白。已解锁角色、完成进度和头像均保留。':'All characters are blank again. Unlocks, completion progress and avatars are kept.',
 '确认清空所有填色':'Clear all colors','正在清空…':'Clearing…','取消':'Cancel','完成':'Done',
 '换一组':'Shuffle','就这组，开始涂鸦':'Start coloring','保存合照图片':'Download portrait','直接在整组角色上填色、泼洒或涂鸦 · 空白处拖动旋转':'Fill, splash or brush across the group · Drag empty space to rotate',
 '位朋友，前后交叠 · 拖动查看，或换一组构图':'friends, layered in depth · Drag to explore or shuffle the layout',
 '拖拽旋转 · 滚轮缩放 · 点击上色':'Drag to rotate · Scroll to zoom · Click to color','拖动画面':'Drag the scene','从每一面看看它':'Explore every side','不要涂得':'Color outside','太乖！':'the lines!','转一转':'Give it a spin',
 '长耳朵':'Long ears','慢太阳':'Slow sun','梦游猫':'Dream cat','叠叠鸟':'Bird tower','花椰树':'Broccoli tree','笑脸骷髅':'Smiling skull','微笑拳套':'Smiling glove','苹果三重奏':'Apple trio','长身白猫':'Long white cat','长腿白鸟':'Long-legged bird','散步扶手椅':'Walking chair','漫游小屋':'Wandering house','怪狼':'Odd wolf','哭太阳':'Crying sun','怪手蛋糕塔':'Hand cake tower','手指鱼鸟':'Finger fishbird','盘盘牙蛇':'Coiled snake','表情叠叠塔':'Face tower','圈圈外星人':'Ring-neck alien',
 '正在保存…':'Saving…','已保存设计记录':'Design saved','进度已自动保存':'Progress autosaved','宇宙合照已保存':'Group portrait saved','保存失败：请检查浏览器存储空间':'Save failed. Check your browser storage.','继续涂鸦':'Continue coloring','自动续画':'Autosave','设计存档':'Saved design','已完成作品':'Artwork completed','完成作品 · 发现新朋友':'Finish artwork · Meet a friend','完成作品 · 解锁下一位':'Finish artwork · Unlock a friend','已获得解锁奖励，可继续修改和存档':'Unlock reward earned. You can keep editing and saving.',
 '已认识':'Friends','已完成':'Completed','可邀请':'Invites','位新朋友':'new friends','正在涂：':'Coloring: ','直接点另一位即可切换':'Click another character to switch','个部位，可分别填色。':'regions to color individually.',
 '张赢':'Zhang Ying','1990 年生于湖北武汉':'Born in Wuhan, Hubei, in 1990','毕业于湖北美术学院水彩专业':'Graduated in watercolor from Hubei Institute of Fine Arts','现工作、生活于上海':'Lives and works in Shanghai','选自《张赢作品集2026》':'From Zhang Ying Portfolio 2026','精选展览与项目':'Selected exhibitions & projects',
 '张赢以水性材料为主要创作媒介，同时探索数字绘画与雕塑。以日常经验为线索，作品关注个体在社会结构中的情绪流动与精神状态。':'Zhang Ying works primarily with water-based media, while exploring digital painting and sculpture. Rooted in everyday experience, his work examines emotional shifts and states of mind within social structures.',
 '轻盈、幽默的视觉语言之下，是对理想与现实之间张力的思考。城乡结合部的成长经历，使其创作在市井叙事与内心象征之间展开，探索当代中国民间文化的情感结构与心理维度。':'Beneath a light, humorous visual language lies a reflection on the tension between ideals and reality. Drawing on his upbringing on the urban fringe, his work moves between everyday narratives and inner symbolism, exploring the emotional and psychological dimensions of contemporary Chinese folk culture.',
 '异化星系运转系统K':'Alienated Galaxy Operating System K','异化星系':'Alienated Galaxy','异化图鉴':'Atlas of Alienation','浮生':'Floating Life','个人项目 · ART ONO，首尔':'Solo project · ART ONO, Seoul','个展 · 引号空间，上海':'Solo exhibition · Quotation Space, Shanghai','个展 · 艺直艺术中心，上海':'Solo exhibition · Yizhi Art Center, Shanghai','个展 · 12S ART SPACE，上海':'Solo exhibition · 12S ART SPACE, Shanghai',
 '我的听力很好，我可以听到你心里的颜色！':'My hearing is so good, I can hear the colors in your heart!',
 '我的光芒可以穿透远方':'My light can reach far beyond the horizon.',
 '我要洗一个泡泡浴，然后染个时髦的毛色！':'A bubble bath first, then a fashionable new fur color!',
 '我们想穿得不一样，但看起来还是一家人。':'We want different colors, but still want to look like a family.',
 '大家都说我只能是绿色，我想试试别的。':'Everyone says I have to be green. I want to try something else.',
 '我想笑得像一颗甜糖，不想吓到朋友。':'Give me a candy-sweet smile so I do not scare my friends.',
 '不去打架了，给我一身适合拥抱的颜色。':'No more fighting. Give me colors made for hugs.',
 '五彩斑斓的水果最好吃，你喜欢什么颜色？':'Colorful fruit tastes the best. What colors do you like?',
 '他们都觉得我凶凶的，我今天要看起来不一样！':'They think I look fierce. Today I want a different look!',
 '我的腿已经准备出门，羽毛还没决定穿什么。':'My legs are ready to go. My feathers are still choosing colors.',
 '我要去参加派对，但不想太显眼。':'I am going to a party, but I do not want to stand out too much.',
 '给我一座可以随身带走的故乡。':'Give me a hometown I can carry wherever I go.',
 '我的牙有点凶，能帮我涂一身友善吗？':'My teeth look fierce. Can you color me friendly?',
 '把眼泪涂成你喜欢的天气，不一定要晴天。':'Color my tears like your favorite weather. It need not be sunny.',
 '今天没有生日，也想办一场五颜六色的庆祝。':'No birthday today, but let us celebrate in every color anyway.',
 '一半想游泳，一半想飞，给我两种自由。':'Half of me wants to swim, half wants to fly. Give me both kinds of freedom.',
 '我想卷成一条温暖的围巾，牙齿只是装饰。':'I want to curl into a warm scarf. The teeth are just decoration.',
 '今天有好多种心情，能帮它们各找一个颜色吗？':'So many moods today. Can you find a color for each one?',
 '我还不认识这里的颜色，可以借我一点地球的心情吗？':'I do not know the colors here yet. Could you lend me a little Earth feeling?',
 '说：':' says: ','关闭':'Close ','首页':'Home','手绘宇宙首页':'Hand-drawn universe','3D 填色画布':'3D coloring canvas','选择角色':'Choose a character',
};
Object.assign(words,{
 '切换场景':'Switch scene','星空漫游':'Star roam','手绘剧场':'Paper theater','合影角度':'Photo angle','换一组朋友':'Change cast',
 '随机位置':'Random positions','暂停动态':'Pause motion','继续动态':'Resume motion',
 '同一组朋友，换个站位 · 确认后定格，开始涂鸦':'Same friends, new places · Confirm to freeze and start coloring',
 '四张原画，一座小剧场 · 拖动发现前后层次':'Four original drawings, one little theater · Drag to discover its layers',
 '正在展开艺术家的布景…':'Unfolding the artist’s scenery…','布景加载失败，请重试':'Scenery could not load. Please try again.',
 '原画布景 × 3D 朋友 · 拖动寻找你的合影角度':'Original scenery × 3D friends · Drag to find your photo angle',
 '合照已生成 · ':'Portrait ready · ','再次下载':'Download again','合照生成失败，请重试':'Portrait could not be generated. Please try again.',
});
for(const [zh,en] of Object.values(CHARACTER_NAMES))words[zh]=en;
const entries=Object.entries(words).sort((a,b)=>b[0].length-a[0].length);
export function translate(text){
  if(words[text.trim()])return text.replace(text.trim(),words[text.trim()]);
  let result=text.replace(/涂色 (\d+)\/3 区，或涂鸦 (\d+)\/3 笔/g,'Fill $1/3 regions or paint $2/3 strokes');
  // One pass prevents translated proper names from being translated again.
  const pattern=new RegExp(entries.map(([key])=>key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'),'g');
  return result.replace(pattern,key=>words[key]);
}
let language='zh';try{language=localStorage.getItem('doodle-language')==='en'?'en':'zh';}catch{}
const originals=new WeakMap(),attrs=new WeakMap();
function render(){
  observer.disconnect();document.documentElement.lang=language==='en'?'en':'zh-CN';
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
    if(node.parentElement?.closest('script,style,textarea,input,[data-no-translate]'))continue;
    let record=originals.get(node);if(!record||node.nodeValue!==record.output)record={source:node.nodeValue};
    record.output=language==='en'?translate(record.source):record.source;
    if(node.nodeValue!==record.output)node.nodeValue=record.output;originals.set(node,record);
  }
  for(const el of document.querySelectorAll('[title],[aria-label],[placeholder],[alt]')){
    if(el.closest('[data-no-translate]'))continue;
    const records=attrs.get(el)||{};
    for(const key of ['title','aria-label','placeholder','alt']){if(!el.hasAttribute(key))continue;const value=el.getAttribute(key);let r=records[key];if(!r||value!==r.output)r={source:value};r.output=language==='en'?translate(r.source):r.source;if(value!==r.output)el.setAttribute(key,r.output);records[key]=r;}attrs.set(el,records);
  }
  const button=document.querySelector('#languageBtn');button.textContent=language==='en'?'中文 / EN ✓':'中文 ✓ / EN';button.setAttribute('aria-label',language==='en'?'Switch to Chinese':'切换到英文');
  observer.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt']});
}
let queued=false;const observer=new MutationObserver(()=>{if(!queued){queued=true;queueMicrotask(()=>{queued=false;render();});}});
document.querySelector('#languageBtn').onclick=()=>{language=language==='en'?'zh':'en';try{localStorage.setItem('doodle-language',language);}catch{}render();};
render();
