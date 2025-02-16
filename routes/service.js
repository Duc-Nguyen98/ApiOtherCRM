const express = require('express');
const router = express.Router();
const sgMail = require('@sendgrid/mail')
const servicesModel = require('../model/schemaService');
const customerModel = require('../model/customer/customer/schemaCustomer');
const groupVoucherModel = require('../model/vouchers/groupVoucher/schemaGroupVoucher');
const voucherItemsModel = require('../model/vouchers/groupVoucher/schemaGroupVoucherItems');
const client = require('twilio')("ACbb5296290de010b74d2e3123ab119085", "fdbcf46f84c94310b301325d1330653d");
var moment = require('moment'); // require
const cron = require('node-cron');
const checkAuthentication = require('../utils/checkAuthentication');


//! Cron sec
cron.schedule('*/1 * * * *', () => {
    let currentDate = moment(Date.now()).format("X");
    currentDate = currentDate * 1000;
    const services = servicesModel.find({ dateAutomaticallySent: currentDate, softDelete: 0 }).then(data => {
        if (data.length !== 0) {
            data.forEach((element, index) => {
                if (element.typeServices == 2) {
                    sendMail(element.mailCustomer, element.titleServices, element.nameCustomer, element.voucherCode, element.discount, element.timeLine, element.listShop, element.content);
                    sendSms(element.telephoneCustomer, element.content, element.titleServices, element.nameCustomer, element.voucherCode, element.discount, element.timeLine, element.listShop);
                } else if (element.typeServices == 1) {
                    sendMail(element.mailCustomer, element.titleServices, element.nameCustomer, element.voucherCode, element.discount, element.timeLine, element.listShop, element.content);
                } else {
                    sendSms(element.telephoneCustomer, element.content, element.titleServices, element.nameCustomer, element.voucherCode, element.discount, element.timeLine, element.listShop);
                }
                const updateMulti = servicesModel.findOneAndUpdate({ _id: element._id }, { statusSend: 1 }).then(data => { });
            });
        }
    });
})





//! FIlter 

const hasFilter = (param, param2, param3, param4) => {
    if (param !== null && param2 !== null) {
        return { typeServices: parseInt(param), statusSend: param2, titleServices: param3, softDelete: param4 }
    }
    else if (param == null && param2 !== null) {
        return { statusSend: param2, titleServices: param3, softDelete: param4 }
    }
    else if (param !== null && param2 == null) {
        return { typeServices: parseInt(param), titleServices: param3, softDelete: param4 }
    }
    else {
        return { titleServices: param3, softDelete: param4 }
    }
}

//! CODE API FOR PERMISSION SUPER ADMIN - ADMIN

const idServicesAuto = async (req, res, next) => {
    await servicesModel.findOne({}, { idServices: 1, _id: 0 }).sort({ idServices: -1 })
        .then(data => {
            (data == null || data == '' || data == undefined) ? AutoId = 10000 : AutoId = data.idServices + 1;
            next();
        })
        .catch(err => {
            console.log(err)
        })
}


const sendSms = async (telephoneCustomer, content, titleServices, nameCustomer, voucherCode, discountVoucher, timeLine, shopApply) => {
    let contentSms = content.replace(/(<([^>]+)>)/ig, '')
    let swapTelephone = telephoneCustomer.replace(/0/i, '+84');
    let arrayListShop = [];
    let listItem = ``;
    let discount = ``;
    let shopApplyItems = shopApply.filter(function (hero) {
        arrayListShop.push(hero.title);
    });
    for (let index = 0; index < arrayListShop.length; ++index) {
        listItem += `${index + 1}-${arrayListShop[index]} `;
    }
    if ((discountVoucher.reduction.money) == null) {
        discount = `Mã giảm giá ${discountVoucher.PercentAMaximum.percent}% cho toàn bộ sản phẩm và giảm tối đa ${(discountVoucher.PercentAMaximum.maximumMoney).toLocaleString('it-IT', { style: 'currency', currency: 'VND' })} `;
    } else {
        discount = `Mã giảm giá ${a.toLocaleString('it-IT', { style: 'currency', currency: 'VND' })} áp dụng cho toàn sản phẩm của cửa hàng.`;
    }
    await client.messages.create({
        // to: swapTelephone,
        // body: content
        from: "+17044455240",
        to: swapTelephone,
        body: `Sự kiện ${titleServices} của CVV-ANT. Xin chào ${nameCustomer}, ${contentSms}, Mã giảm giá là: ${voucherCode}, chi tiết áp dụng: ${discount}, thời hạn sử dụng của voucher từ ngày ${moment(timeLine.release).format("DD-MM-YYYY")} đến ngày ${moment(timeLine.expiration).format("DD-MM-YYYY")}.Lưu ý danh sách các cửa hàng áp dụng khuyến mãi là: ${listItem}. ANT - CVV xin cảm ơn quý khách đã tin dùng dịch vụ của chúng tôi!`,
    }).then(message => {
        console.log("SMS sent...!");

    }).catch(err => {
        console.log(err);
    })
}

const sendMail = (to, subject, nameCustomer, voucherCode, discountVoucher, timeLine, shopApply, content) => {
    const API_KEY = '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';
    sgMail.setApiKey(API_KEY);
    let arrayListShop = [];
    let listItem = ``;
    let discount = ``;
    let shopApplyItems = shopApply.filter(function (hero) {
        arrayListShop.push(hero.title);
    });
    for (let index = 0; index < arrayListShop.length; ++index) {
        listItem += `${index + 1}-${arrayListShop[index]} `;
    }
    if ((discountVoucher.reduction.money) == null) {
        discount = `Sale <b>${discountVoucher.PercentAMaximum.percent}%</b> for all products and maximum reduction <b>${(discountVoucher.PercentAMaximum.maximumMoney).toLocaleString('it-IT', { style: 'currency', currency: 'VND' })}</b>`;
    } else {
        discount = `Sale <b>${a.toLocaleString('it-IT', { style: 'currency', currency: 'VND' })}</b> applicable to all products of the store.`;
    }

    const message = {
        to: to,
        from: 'ducnin1998@gmail.com',
        subject: subject,
        html: `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"><html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office"><head><title>Runtastic</title><meta name="viewport" content="initial-scale=1, user-scalable=yes"> <!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge" /><!--<![endif]--><style type="text/css">.la1 a{font - weight:normal;text-decoration:none;color:#2b2c2c}@media only screen and (max-width:414px){.fl{display:block !important;width:100% !important}.fw{width:100% !important;min-width:0 !important}.sec{width:100% !important;float:none !important}.mh,.mobile_hidden{display:none !important}.image{width:100% !important;height:auto !important}.comt{margin:0 auto !important}.com{text - align:center}.lom{text - align:left}font{font - size:16px !important;font-size:5vw !important}.h1, .h1 font{font - size:35px !important;font-size:10.9375vw !important}.h2, .h2 font{font - size:30px !important;font-size:9.375vw !important}.h3, .h3 font{font - size:18px !important;font-size:5.625vw !important}.small, .small font{font - size:15px !important;font-size:4.6875vw !important}.xsmall, .xsmall font{font - size:13px !important;font-size:4.0625vw !important}.xxsmall, .xxsmall font{font - size:12px !important;font-size:3.75vw !important}.lh, .lh font{line - height:normal !important}.mcta{padding:10px 5px !important;padding:3.125vw 5px !important;-moz-border-radius:25px !important;-webkit-border-radius:25px !important;border-radius:25px !important;-moz-border-radius:7.8125vw !important;-webkit-border-radius:7.8125vw !important;border-radius:7.8125vw !important}.cta3a, .cta3a td{background:none !important;-moz-border-radius:0 !important;-webkit-border-radius:0 !important;border-radius:0 !important;padding:0 !important}.cta3a a{-moz - border - radius:25px;-webkit-border-radius:25px;border-radius:25px;padding:10px 5px;-moz-border-radius:7.8125vw;-webkit-border-radius:7.8125vw;border-radius:7.8125vw;padding:3.125vw 5px}.rwom{width:auto !important}.rhom{height:auto !important}.rw10, .rw10 img{width:10px !important}.rw30, .rw30 img{width:30px !important}.rh1, .rh1 img{height:1px !important}.rh5, .rh5 img{height:5px !important;height:1.5625vw !important}.rh10, .rh10 img{height:10px !important;height:3.125vw !important}.rh15, .rh15 img{height:15px !important;height:4.6875vw !important}.rh20, .rh20 img{height:20px !important;height:6.25vw !important}.rh50, .rh50 img{height:50px !important;height:15.625vw !important}.rh60, .rh60 img{height:60px !important;height:18.75vw !important}.rh70, .rh70 img{height:70px !important;height:21.875vw !important}.rh80, .rh80 img{height:80px !important;height:25vw !important}.mtop10{margin - top:10px;margin-top:3.125vw}.mbot10{margin - bottom:10px;margin-bottom:3.125vw}.mbot40{margin - bottom:40px;margin-bottom:12.5vw}.mbot50{margin - bottom:50px;margin-bottom:15.625vw}.mtop5{margin - top:5px;margin-top:1.5625vw}.plr10{padding:0 10px}.ptb10{padding:10px 0}.pbot10{padding - bottom:10px;padding-bottom:3.125vw}.pbot5{padding - bottom:10px;padding-bottom:1.5625vw}.sm1{margin - bottom:10px !important;margin-bottom:3.125vw !important}.break{display:block !important}.nobg{background:none !important}.cntbg{background - size:cover !important;background-position:center !important}u + .body .gwfw{width:100% !important;width:100vw !important}}<!-- body{margin:0;padding:0;background:#eeeff1;-webkit-text-size-adjust:none;-ms-text-size-adjust:none}a, a:active, a:visited, .yshortcuts, .yshortcuts a span{color:#007aff;text-decoration:underline;font-weight:normal}a[x-apple-data-detectors]{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}td div,button{display:block !important}.ReadMsgBody{width:100%}.ExternalClass *,.b-message-body{line - height:100%}.ExternalClass{width:100%}input{display:none !important;max-height:0px;overflow:hidden}table th{padding:0;Margin:0;border:0;font-weight:normal;vertical-align:top}*[lang="uri"] a{color:inherit !important;text-decoration:none !important;font-size:inherit !important;font-family:inherit !important;font-weight:inherit !important;line-height:inherit !important}</style><![endif]--></head><body class="body"><div style="display:none; width:0px; height:0px; max-width:0px; max-height:0px; overflow:hidden; mso-hide:all;"><font face="Helvetica, Arial, sans-serif" style="font-size:0px; line-height:0px; color:#eeeff1;">It’s your birthday, yay! Of course, we have to celebrate with a special gift exclusively for you on your special day. We are so thankful that you are a part of the Runtastic community and we cannot DISCOUNT your loyalty and hard work. Hurry, open up &amp; get your birthday present today!<br> </font></div><div class="yfix"><table cellspacing="0" cellpadding="0" border="0" width="100%" bgcolor="#eeeff1" class="gwfw"><tr><td width="100%" align="center"><table cellspacing="0" cellpadding="0" border="0" width="600" class="fw"><tr><td height="15" class="rh5"><img src="http://link.runtastic.com/img/trans.gif" width="1" height="15" style="display:block;"></td></tr><tr><td height="1"><img src="http://link.runtastic.com/mo/DsBAbJwFVX_645781705_1432009_14276_682127.gif" height="1" style="display:block;"></td></tr></table></td></tr><tr><td align="center"><table cellspacing="0" cellpadding="0" border="0" width="600" bgcolor="#ffffff" class="fw"><tr class="sectiongroup_4312 is_mobile_hideable"><td><table border="0" cellspacing="0" cellpadding="0" bgcolor="#007aff" width="100%"><tr><td align="center" style="padding:15px 0;"><a href="http://link.runtastic.com/u/nrd.php?p=DsBAbJwFVX_14276_1432009_2_64&ems_l=682127" target="_blank"><img src="http://link.runtastic.com/templates/run6en/img/logo6.png" width="165" border="0" style="display:block;"></a></td></tr></table></td></tr><tr class="sectiongroup_4314 is_mobile_hideable"><td><table cellpadding="0" cellspacing="0" border="0" width="100%" class="is_image_mobile_hideable"><tr><td align="center"><a href="http://link.runtastic.com/u/nrd.php?p=DsBAbJwFVX_14276_1432009_3_2&ems_l=682127&d=SEFQUFlCRC1DQ1hULVpBV1Y%3D%7C" target="_blank" e:section-id="3"><img width="600" id="section_image_3" src="http://link.runtastic.com/custloads/645781705/md_5725.gif" border="0" style="display:block;" class="image" alt="Your Gift" title="Your Gift"></a></td></tr></table></td></tr><tr class="sectiongroup_4321 is_mobile_hideable"><td><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td valign="middle" height="245" bgcolor="#d7eaff"><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td colspan="3" class="rh10" height="5"><img src="http://link.runtastic.com/img/trans.gif" style="display: block;" width="1" height="5" /></td></tr><tr><td class="rhom" width="30" height="235"><img src="http://link.runtastic.com/img/trans.gif" style="display: block;" width="1" height="225" /></td><td><table width="100%" cellspacing="0" cellpadding="0" border="0"><tbody><tr><td class="h2" align="center"><font style="font-size: 40px; color: rgb(0, 51, 102); text-decoration: none; font-weight: normal;" face="Helvetica, Verdana, sans-serif">​Gift vouchers for <br />${nameCustomer}!</font></td></tr><tr><td height="10"><img src="http://link.runtastic.com/img/trans.gif" style="display: block;" width="1" height="10" /></td></tr><tr><td align="center"><font style="font-size: 14px; line-height: 24px; color: rgb(0, 51, 102);" face="Helvetica, Verdana, sans-serif"><div style="text-align: center;"><span style="color: rgb(0, 51, 102);"><br />Hello <b>${nameCustomer}</b>! Our <b>ANT-CVV</b> systems offer a Discount code: ${discount}, the expiry date of the voucher from the date <b>${moment(timeLine.release).format("DD-MM-YYYY")}</b> to date <b>${moment(timeLine.expiration).format("DD-MM-YYYY")}</b>. Note that the list of shops applying for the promotion is: <b>${listItem}</b>. <b>ANT-CVV</b> would like to thank you for using our service!</span></div> </font></td></tr></tbody></table></td><td width="30"><br /></td></tr><tr><td colspan="3" class="rh10" height="5"><img src="http://link.runtastic.com/img/trans.gif" style="display: block;" width="1" height="5" /></td></tr></tbody></table></td></tr></tbody></table></td></tr><tr class="sectiongroup_4332 is_mobile_hideable"><td><table width="100%" border="0" cellspacing="0" cellpadding="0" bgcolor="#d7eaff"><tbody><tr><td><table width="100%" border="0" cellspacing="0" cellpadding="0"><tbody><tr><td width="30"><img height="1" width="30" src="http://link.runtastic.com/img/trans.gif" /></td><td align="center"><table class="olbg007aff fw" style="direction: ltr;" dir="ltr" width="250" border="0" cellspacing="0" cellpadding="0"><tbody><tr> <!--[if (gte mso 9)|(IE)]><td width="26" align="left" valign="top" style="display:none;" class="olb"><img src="http://link.runtastic.com/templates/run6en/i/lt.png" width="26" height="26"></td><td rowspan="2" valign="middle" style="vertical-align:middle;"><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr> <![endif]--><td class="oltd" align="center"><a class="olcta mcta" style="color: rgb(255, 255, 255); font-weight: normal; text-decoration: none; background-color: rgb(0, 122, 255); border-radius: 26px; padding: 16px 26px; display: block;" target="_blank" href="http://link.runtastic.com/u/nrd.php?p=DsBAbJwFVX_14276_1432009_11_55&ems_l=682127&d=SEFQUFlCRC1DQ1hULVpBV1Y%3D%7C"><font style="font-size: 15px; color: rgb(255, 255, 255); text-transform: uppercase;" face="Helvetica, Arial, sans-serif"><b>${voucherCode}</b></font></a></td> <!--[if (gte mso 9)|(IE)]></tr></table></td><td width="26" align="right" valign="top" style="display:none;" class="olb"><img src="http://link.runtastic.com/templates/run6en/i/rt.png" width="26" height="26"></td> <![endif]--></tr> <!--[if (gte mso 9)|(IE)]><tr style="display:none;" class="olb"><td align="left" valign="bottom"><img src="http://link.runtastic.com/templates/run6en/i/lb.png" width="26" height="26"></td><td align="right" valign="bottom"><img src="http://link.runtastic.com/templates/run6en/i/rb.png" width="26" height="26"></td></tr> <![endif]--></tbody></table></td><td width="30"><img height="1" width="30" src="http://link.runtastic.com/img/trans.gif" /></td></tr></tbody></table></td></tr><tr><td class="rh60" height="30"><img style="display: block;" height="30" width="1" src="http://link.runtastic.com/img/trans.gif" /></td></tr></tbody></table></td></tr><tr class="sectiongroup_4351 is_mobile_hideable"><td><table cellpadding="0" cellspacing="0" border="0" width="100%"><tr><td height="10" bgcolor="#eeeff1"><img src="http://link.runtastic.com/img/trans.gif" width="1" height="10" style="display:block;"></td></tr></table></td></tr></table></td></tr></table></td></tr></table><div style="display:none; white-space:nowrap; font:15px courier; line-height:0;" class="mh">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div></div></body></html></body></html>`
    }
    sgMail.send(message)
        .then(response => console.log('Email sent...!'))
        .catch(error => console.log(error.message))
}


const checkIdCustomer = async (req, res, next) => {
    let idCustomer = req.body.idCustomer;
    const entry = await customerModel.findOne({ idCustomer: idCustomer })
        .select({ idCustomer: 1, telephone: 1, email: 1, name: 1 }).then(data => {
            dataCustomer = data;
            next();

        }).catch(err => {
            return err
        })
}

const checkIdGroupVoucher = async (req, res, next) => {
    let idGroupVoucher = req.body.idGroupVoucher;
    const entry = await groupVoucherModel.findOne({ idGroupVoucher: idGroupVoucher })
        .select({ idGroupVoucher: 1, title: 1, listShop: 1 }).then(data => {
            dataGroupVoucher = data;
            next();
        }).catch(err => {
            return err
        })
}


const checkVoucherItems = async (req, res, next) => {
    let idGroupVoucher = req.body.idGroupVoucher;
    let voucherCode = req.body.voucherCode;
    const entry = await voucherItemsModel.findOne({ idGroupVoucher: idGroupVoucher, voucherCode: voucherCode }).then(data => {
        infoVoucherCode = data;
        next();
    }).catch(err => {
        return err
    })
}

function msToTime(duration) {
    duration *= 1000;
    var milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    hours = (hours < 10 && hours > 0) ? "0" + hours : hours;
    minutes = (minutes < 10 && minutes > 0) ? "0" + minutes : minutes;
    minutesEd = parseInt(minutes) + 1;
    return `${hours} hours, ${minutesEd} minutes.`;
}

router.get('/list/customer', checkAuthentication, async function (req, res, next) {
    try {
        const customers = await customerModel.find({ softDelete: 0 }).select({ "idCustomer": 1, "name": 1, "telephone": 1, "email": 1, "avatar": 1 });
        return res.status(200).json({
            success: true,
            customers: customers,
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});

router.get('/list/group-voucher', checkAuthentication, async function (req, res, next) {
    try {
        const groupVoucher = await groupVoucherModel
            .find({ status: 1, softDelete: 0 })
            .select({ "created": 0, "modified": 0, "softDelete": 0 });

        return res.status(200).json({
            success: true,
            groupVoucher: groupVoucher,
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});



router.get('/list/group-voucher/voucher-items/:idGroupVoucher', checkAuthentication, async function (req, res, next) {
    try {
        let idGroupVoucher = req.params.idGroupVoucher;
        const voucherItems = await voucherItemsModel
            .find({ idGroupVoucher: idGroupVoucher, status: 1, softDelete: 0 })
            .select({ "created": 0, "modified": 0, "softDelete": 0 });

        return res.status(200).json({
            success: true,
            voucherItems: voucherItems,
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});


/* GET Details users listing. */
// TODO: METHOD - GET
// -u http://localhost:1509/user/create
// ? Example: http://localhost:1509/user/create
router.post('/create', checkAuthentication, idServicesAuto, checkIdCustomer, checkIdGroupVoucher, checkVoucherItems, async function (req, res, next) {
    try {
        let idGroupVoucher = req.body.idGroupVoucher;
        let typeServices = req.body.typeServices;
        let dateAutomaticallySent = req.body.dateAutomaticallySent;
        let titleServices = req.body.titleServices;
        let content = req.body.content;
        let price = req.body.price;
        let currentDate = Math.floor(new Date().getTime() / 1000.0);
        const data = {
            idServices: AutoId,
            idCustomer: dataCustomer.idCustomer,
            idUser: userObj.idUser,
            idGroupVoucher: idGroupVoucher,
            idVoucher: infoVoucherCode.idVoucher,
            titleServices: titleServices,
            listShop: dataGroupVoucher.listShop,
            nameCustomer: dataCustomer.name,
            telephoneCustomer: dataCustomer.telephone,
            mailCustomer: dataCustomer.email,
            voucherCode: infoVoucherCode.voucherCode,
            price: price,
            typeServices: typeServices,
            content: content,
            dateAutomaticallySent: dateAutomaticallySent,
            discount: infoVoucherCode.discount,
            timeLine: infoVoucherCode.timeLine,
            details: {
                createBy: `US${userObj.idUser}-${userObj.name}`,
                time: Date.now()
            },
            statusSend: 0,
            softDelete: 0
        }

        const serviceCreate = await servicesModel.create(data);
        const updateVoucherItem = await voucherItemsModel.findOneAndUpdate({ idVoucher: infoVoucherCode.idVoucher, softDelete: 0 }, { status: 3, idCustomersUse: dataCustomer.idCustomer, nameCustomerUse: dataCustomer.name });
        return res.status(200).json({
            success: true,
            message: "Create Successfully",
            details: `@ISC${AutoId} will be sent automatically after: ${msToTime((dateAutomaticallySent / 1000) - currentDate)} `

        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});






router.get('/list', checkAuthentication, async function (req, res, next) {
    try {
        let type = req.query.type;
        let status = req.query.status;
        let softDelete = 0;
        let q = req.query.q;
        (type == undefined || type == '') ? type = null : type = type;
        (status == undefined || status == '') ? status = null : status = status;
        let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive
        //? Begin config Pagination
        let pagination = {
            currentPage: parseInt(req.query.page),
            totalItemsPerPage: parseInt(req.query.perPage)
        }

        const services = await servicesModel
            .find(hasFilter(type, status, regex, softDelete))
            .limit(pagination.totalItemsPerPage)
            .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);


        const totalRecords = await servicesModel.countDocuments(hasFilter(type, status, regex, softDelete));
        Promise.all([services, totalRecords]).then(([services, totalRecords]) => {
            return res.status(200).json({
                success: true,
                totalRecords: totalRecords,
                services: services,
            });
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});

router.get('/list/trash', checkAuthentication, async function (req, res, next) {
    try {
        let type = req.query.type;
        let status = req.query.status;
        let softDelete = 1;
        let q = req.query.q;
        (type == undefined || type == '') ? type = null : type = type;
        (status == undefined || status == '') ? status = null : status = status;
        let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive

        //? Begin config Pagination
        let pagination = {
            currentPage: parseInt(req.query.page),
            totalItemsPerPage: parseInt(req.query.perPage)
        }

        const services = await servicesModel
            .find(hasFilter(type, status, regex, softDelete))
            .limit(pagination.totalItemsPerPage)
            .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);


        const totalRecords = await servicesModel.countDocuments(hasFilter(type, status, regex, softDelete));
        Promise.all([services, totalRecords]).then(([services, totalRecords]) => {
            return res.status(200).json({
                success: true,
                totalRecords: totalRecords,
                services: services,
            });
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});





/* GET Details users listing. */
// TODO: METHOD - GET
// -u http://localhost:1509/services/sms/detail/:id
// ? Example: http://localhost:1509/services/sms/detail/606f591f41340a452c5e8376
router.get('/detail/:id', async function (req, res, next) {
    try {
        const _id = req.params.id;
        await servicesModel
            .findOne({ _id: _id })
            .then(data => {
                return res.status(200).json({
                    success: true,
                    data: data
                });
            })
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});


/* DELETE todo listing deleteSoft Record */
// TODO: METHOD - DELETE
// -u http://localhost:1509/services/sms/delete-soft/:id
router.delete('/delete-soft/:id', async function (req, res, next) {
    try {
        const _id = req.params.id;
        const entry = await servicesModel.updateOne({ _id: _id }, { softDelete: 1 });
        return res.status(200).json({
            success: true,
            message: "Delete-Soft Successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});

/* DELETE todo listing deleteSoft Record */
// TODO: METHOD - DELETE
// -u http://localhost:1509/services/sms/delete/:id
router.delete('/delete/:id', async function (req, res, next) {
    try {
        const _id = req.params.id;
        const entry = await servicesModel.findByIdAndDelete({ _id: _id });
        return res.status(200).json({
            success: true,
            message: "Delete Successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});


/* PATCH todo listing change isStarred isComplete. */
// TODO: METHOD - PATCH
// -u http://localhost:1509/services/sms/trash/restore/:id

router.patch('/trash/restore/:id', async function (req, res, next) {
    try {
        const _id = req.params.id;

        const entry = await servicesModel.findOneAndUpdate({ _id: _id }, {
            softDelete: 0,
        });
        return res.status(200).json({
            success: true,
            message: "Restore Successfully"
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});

/* PATCH todo listing change isStarred isComplete. */
// TODO: METHOD - PATCH
// -u http://localhost:1509/delete/many/voucher

router.patch('/delete-soft/many/services', async function (req, res, next) {
    try {
        let obj = req.body.ServicesIdArray;
        const entry = await servicesModel.updateMany({ _id: { $in: obj } }, {
            softDelete: 1
        }, (err, result) => {
            return res.status(200).json({
                success: true,
                message: "Delete-Soft Successfully"
            });
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});


/* PATCH todo listing change isStarred isComplete. */
// TODO: METHOD - PATCH
// -u http://localhost:1509/delete/many/voucher

router.patch('/trash/restore/many/services', async function (req, res, next) {
    try {
        let obj = req.body.ServicesIdArray;
        const entry = await servicesModel.updateMany({ _id: { $in: obj } }, {
            softDelete: 0
        }, (err, result) => {
            return res.status(200).json({
                success: true,
                message: "Restore Successfully"
            });
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});



/* PATCH todo listing change isStarred isComplete. */
// TODO: METHOD - PATCH
// -u http://localhost:1509/delete/many/voucher

router.patch('/trash/delete/many/services', async function (req, res, next) {
    try {
        let obj = req.body.ServicesIdArray;
        const entry = await servicesModel.deleteMany({ _id: { $in: obj } }, (err, result) => {
            return res.status(200).json({
                success: true,
                message: "Deleted Successfully"
            });
        })
    } catch (err) {
        console.log(err)
        return res.status(500).json({
            success: false,
            error: 'Server Error'
        });
    };
});






//! CODE API FOR PERMISSION EMPLOYEE

module.exports = router;
