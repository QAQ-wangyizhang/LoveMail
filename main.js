//2.0 导入 superagent包，用于Node 服务器发送http请求
const request = require('superagent');
//3.0 导入 cheerio，把字符串解析成HTML
const cheerio = require('cheerio');
//4.0 导入模板引擎
const template = require('art-template');
//导入 path 模块处理路径
const path = require('path');
//5.0 导入发送邮件包
const nodemailer = require("nodemailer");
//6.0 导入定时发送邮件包
const schedule = require("node-schedule");

//1.0 计算认识的天数
function getDayData(){
    return new Promise((resolve,reject) => {
           //现在的时间
    const today = new Date();
    //认识的时间 2019-12-01
    const meet = new Date('2019-12-07');
    //计算相识到今天的天数
    const count = Math.ceil((today - meet) / 1000 / 60 / 60 / 24);
    //今天的日期格式化
    const format = today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + today.getDate();
    const dayData = {
        count,
        format
    }
    // console.log(dayData);
    resolve(dayData);
    });
}
// getDayData();

//2.1 请求墨迹天气获取数据
function getMojiData(){
    return new Promise((resolve,reject) =>{
        request('https://tianqi.moji.com/weather/china/ningxia/yinchuan').end((err,res)=>{
            if(err) return console.log("数据请求失败，请检查路径");
            //console.log(res.text);
            //把字符串解析成HTML并可用jQuery核心选择器选择对应内容
            const $ = cheerio.load(res.text);
            // 图标
            const icon = $('.wea_weather span img').attr('src');
            // 天气
            const weather = $('.wea_weather b').text();
            // 温度
            const temperature = $('.wea_weather em').text()
            // 提示
            const tips =  $('.wea_tips em').text();
    
            const mojiData = {
                icon,
                weather,
                temperature,
                tips
            }
            // console.log(mojiData)
            resolve(mojiData);
        })
    })
}
// getMojiData();

// 请求One 页面抓取数据
function getOneData(){
    return new Promise((resolve,reject) =>{
        request('http://wufazhuce.com/').end((err,res)=>{
            if(err) return console.log("数据请求失败，请检查路径");
            
            // 把返回值中的页面解析成HTML
            const $ = cheerio.load(res.text);
            // 抓取one的图片
            const img = $('.carousel-inner>.item>img, .carousel-inner>.item>a>img ').eq(0).attr('src');
            // 抓取one的文本
            const text = $('.fp-one .fp-one-cita-wrapper .fp-one-cita a').eq(0).text();
            const oneData = {
                img,
                text
            }
            // console.log(oneData)
            resolve(oneData);
        })
    })

}
// getOneData();

// 4.0 通过模板引起替换 HTML 的数据
async function renderTemplate(){
    //获取 日期
   const dayData = await getDayData();
    //获取 墨迹天气数据
   const mojiData = await getMojiData();
    //获取 One 的数据
   const oneData = await getOneData();

    //2.所有数据都获取成功的时候，才进行模板引起数据的替换
    // console.log(dayData);
    // console.log(mojiData);
    // console.log(oneData);
    return new Promise((resolve,reject)=>{
        const html = template(path.join(__dirname,'./love.html'),{
            dayData,
            mojiData,
            oneData
        });
        // console.log(html);
        resolve(html);
    })


}
// renderTemplate();

//发送邮件
async function sendNodeMail(){
    // HTML 页面内容，通过await 等待模板引擎渲染完毕然后往下走
    const html = await renderTemplate();
    console.log(html);
    // 使用默认SMTP传输，创建可重用邮箱对象
    let transporter = nodemailer.createTransport({
        host: "smtp.163.com",
        port: 465, //开启加密协议 ，使用465端口号
        secure: true,
        auth: {
            user: "wanyyizhang520@163.com",//用户名
            pass: "qaq123"//客户端授权密码
        }
    });

    // 设置电子邮件数据
    let mailOpations = {
        from: '"王艺璋"<wanyyizhang520@163.com>',
        to: '"Ambition"<3452132350@qq.com>',
        subject: "爱的邮件",
        html: html
    };

    transporter.sendMail(mailOpations,(error,info={})=>{
        if(error){
            console.log(error);
            sendNodeMail();//再次发送
        }
        console.log("邮件发送成功", info.messageId);
        console.log("静等下一次发送");
    });
}
sendNodeMail();

//6. 定时每天 5时20分00秒发送邮件给李军燕
//创建定时任务
// var j = schedule.scheduleJob("00 * * * * *",function(){
//     sendNodeMail();
//     console.log("定时任务的邮件发送成功");
// });