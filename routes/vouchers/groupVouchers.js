const express = require('express');
const router = express.Router();
var moment = require('moment'); // require

const groupVoucherModel = require('../../model/vouchers/groupVoucher/schemaGroupVoucher');
const groupVoucherItemsModel = require('../../model/vouchers/groupVoucher/schemaGroupVoucherItems');
const groupCustomerModel = require('../../model/customer/groupCustomer/schemaGroupCustomer');
const shopModel = require('../../model/schemaShop');

const hasFilterGroupVoucher = (param, param2, param3, param4) => {
  if (param !== null && param2 !== null) {
    return { classified: param, status: param2, title: param3, softDelete: param4 }
  } else if (param == null && param2 !== null) {
    return { status: param2, title: param3, softDelete: param4 }
  } else if (param !== null && param2 == null) {
    return { classified: param, title: param3, softDelete: param4 }
  } else {
    return { title: param3, softDelete: param4 }
  }
}

const voucherItems = (param, param2, param3, param4) => {
  return { voucherCode: param, softDelete: param2, idGroupVoucher: param3, status: param4 }
}
//! CODE API FOR PERMISSION SUPER ADMIN - ADMIN

const idAutoGroup = async (req, res, next) => {
  await groupVoucherModel.findOne({}, { idGroupVoucher: 1, _id: 0 }).sort({ idGroupVoucher: -1 })
    .then(data => {
      AutoId = data.idGroupVoucher + 1;
      next();
    })
    .catch(err => {
      console.log(err)
    })
}
const idAutoGroupVoucher = async (req, res, next) => {
  await groupVoucherItemsModel.findOne({}, { idVoucher: 1, _id: 0 }).sort({ idVoucher: -1 })
    .then(data => {
      AutoIdVoucher = data.idVoucher + 1;
      next();
    })
    .catch(err => {
      console.log(err)
    })
}

const updateVoucherAdd = async (req, res, next) => {
  const _id = req.params.id;

  const entry = await groupVoucherModel
    .findOne({ _id: _id })
    .select({ "idGroupVoucher": 1 })
    .then(data => {
      idGroupVoucher = data;
      next();
    })

}


checkVoucherExpired = async (req, res, next) => {
  let todayDate = moment(new Date()).format("YYYY-MM-DD");
  try {
    const entry = await groupVoucherItemsModel.updateMany({ "timeLine.effective.expiration": { $lt: todayDate } }, {
      status: 2,
    }, (err, result) => {
      next();
    })
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  };
}


// /* GET List Group Voucher listing. */
// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/list
// ? Example: http://localhost:1509/voucher/group/list

router.get('/list', async function (req, res, next) {
  try {
    let classified = req.query.classified;
    let status = req.query.status;
    let softDelete = 0;
    let q = req.query.q;
    (classified == undefined || classified == '') ? classified = null : classified = classified;
    (status == undefined || status == '') ? status = null : status = status;

    let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive

    //? Begin config Pagination
    let pagination = {
      currentPage: parseInt(req.query.page),
      totalItemsPerPage: parseInt(req.query.perPage)
    }
    const groupVouchers = await groupVoucherModel
      .find(hasFilterGroupVoucher(classified, status, regex, softDelete))
      .select()
      .sort({ "idGroupVoucher": -1 })
      .limit(pagination.totalItemsPerPage)
      .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);

    const countGroupVoucher = await groupVoucherModel.countDocuments(hasFilterGroupVoucher(classified, status, regex, softDelete));

    Promise.all([groupVouchers, countGroupVoucher]).then(([groupVouchers, countGroupVoucher]) => {
      return res.status(200).json({
        success: true,
        groupVouchers: groupVouchers,
        countGroupVoucher: countGroupVoucher
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

// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/trash
// ? Example: http://localhost:1509/voucher/group/trash

router.get('/trash', async function (req, res, next) {
  try {
    let classified = req.query.classified;
    let status = req.query.status;
    let softDelete = 1;
    let q = req.query.q;
    (classified == undefined || classified == '') ? classified = null : classified = classified;
    (status == undefined || status == '') ? status = null : status = status;

    let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive

    //? Begin config Pagination
    let pagination = {
      currentPage: parseInt(req.query.page),
      totalItemsPerPage: parseInt(req.query.perPage)
    }
    const groupVouchers = await groupVoucherModel
      .find(hasFilterGroupVoucher(classified, status, regex, softDelete))
      .select()
      .sort({ "idGroupVoucher": -1 })
      .limit(pagination.totalItemsPerPage)
      .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);

    const countGroupVoucher = await groupVoucherModel.countDocuments(hasFilterGroupVoucher(classified, status, regex, softDelete));

    Promise.all([groupVouchers, countGroupVoucher]).then(([groupVouchers, countGroupVoucher]) => {
      return res.status(200).json({
        success: true,
        groupVouchers: groupVouchers,
        countGroupVoucher: countGroupVoucher
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


/* DELETE todo listing deleteSoft Record */
// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/delete-soft/:id
// ? Example: http://localhost:1509/voucher/group/delete-soft/:

router.delete('/delete-soft/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;
    const entry = await groupVoucherModel.findOneAndUpdate({ _id: _id }, { softDelete: 1 });
    return res.status(200).json({
      success: true,
      message: "Deleted Soft Successfully"
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
// -u http://localhost:1509/voucher/group//trash/restore/:id
// ? Example: http://localhost:1509/voucher/group/trash/restore/6084868594ca7c92289c2bad

router.patch('/trash/restore/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;

    const entry = await groupVoucherModel.findOneAndUpdate({ _id: _id }, {
      softDelete: 0,
    });
    return res.status(200).json({
      success: true,
      message: "Successful Recovery"
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
// -u http://localhost:1509/voucher/group/delete/:id
// ? Example: http://localhost:1509/voucher/group/delete/:

router.delete('/delete/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;
    const entry = await groupVoucherModel.findOneAndDelete({ _id: _id });
    return res.status(200).json({
      success: true,
      message: "Deleted Successfully"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  };
});


router.get('/list/customer', async function (req, res, next) {
  try {
    const listGroupCustomer = await groupCustomerModel.find({ status: 0, softDelete: 0 }).select({ "idGroupCustomer": 1, "avatarGroup": 1, "title": 1, "_id": 1 })
    return res.status(200).json({
      success: true,
      listGroupCustomer: listGroupCustomer,
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  };
});

router.get('/list/shop', async function (req, res, next) {
  try {
    const listShop = await shopModel.find({ status: 0, softDelete: 0 }).select({ "idShop": 1, "avatar": 1, "name": 1, "_id": 1 })
    return res.status(200).json({
      success: true,
      listShop: listShop,
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
// -u http://localhost:1509/voucher/group/create
// ? Example: http://localhost:1509/voucher/group/create
router.post('/create', idAutoGroup, async function (req, res, next) {

  try {
    const groupVoucher = await groupVoucherModel.create({
      idGroupVoucher: AutoId,
      title: req.body?.title,
      note: req.body?.note,
      status: req.body?.status,
      scopeApply: req.body?.scopeApply,
      softDelete: 0,
      created: {
        createBy: "admin",
        time: Date.now()
      },
      modified: {
        modifyBy: "admin",
        time: Date.now()
      }
    })
    return res.status(200).json({
      success: true,
      message: "Successfully Created"
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  };
});

// * GET Details users listing. 
// TODO: METHOD - GET
// -u http://localhost:1509/mail/task/detail/:id
// ? Example: http://localhost:1509/mail/task/detail/606f591f41340a452c5e8376
router.get('/detail/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;
    await groupVoucherModel
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




/* PATCH todo listing change isStarred isComplete. */
// TODO: METHOD - PATCH
// -u http://localhost:1509/update/:id

router.put('/update/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;

    const entry = await groupVoucherModel.findByIdAndUpdate({ _id: _id }, {
      note: req.body?.note,
      title: req.body?.title,
      note: req.body?.note,
      status: req.body?.status,
      scopeApply: req.body?.scopeApply,
      modified: {
        createBy: "Admin",
        time: Date.now()
      }
    });

    return res.status(200).json({
      success: true,
      message: "Update Successful"
    });
  } catch (err) {
    console.log(err)
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  };
});


// //! VOUCHER ITEMS

// // /* GET List Group Voucher listing. */
// // TODO: METHOD - GET
// // -u http://localhost:1509/voucher/group/list/voucher/item/:idGroupVoucher
// // ? Example: http://localhost:1509/voucher/group/list/voucher/item/:idGroupVoucher

router.get('/list/voucher/item/:idGroupVoucher', checkVoucherExpired, async function (req, res, next) {
  try {
    let idGroupVoucher = req.params.idGroupVoucher;
    let softDelete = 0;
    let status = req.query.status;

    let q = req.query.q;

    let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive

    (idGroupVoucher == undefined || idGroupVoucher == '') ? idGroupVoucher = null : idGroupVoucher = idGroupVoucher;
    (status == undefined || status == '' || status == 3 || status == 4 || status == 5) ? status = { $lte: 2 } : status = status;


    //? Begin config Pagination
    let pagination = {
      currentPage: parseInt(req.query.page),
      totalItemsPerPage: parseInt(req.query.perPage)
    }

    const groupVoucherItems = await groupVoucherItemsModel
      .find(voucherItems(regex, softDelete, idGroupVoucher, status))
      .select()
      .sort({ "idVoucher": -1 })
      .limit(pagination.totalItemsPerPage)
      .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);
    const countGroupVoucherItems = await groupVoucherItemsModel.countDocuments(voucherItems(regex, softDelete, idGroupVoucher, status));

    const typeClassifiedGroup = await groupVoucherModel.findOne({ idGroupVoucher: idGroupVoucher }).select({ classified: 1 });

    Promise.all([groupVoucherItems, countGroupVoucherItems, typeClassifiedGroup]).then(([groupVoucherItems, countGroupVoucherItems, typeClassifiedGroup]) => {
      console.log(typeClassifiedGroup)
      return res.status(200).json({
        success: true,
        groupVoucherItems: groupVoucherItems,
        typeClassifiedGroup: typeClassifiedGroup,
        countGroupVoucherItems: countGroupVoucherItems,
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

// // /* GET List Group Voucher listing. */
// // TODO: METHOD - GET
// // -u http://localhost:1509/voucher/group/list/voucher/item/:idGroupVoucher
// // ? Example: http://localhost:1509/voucher/group/history/voucher/item/:idGroupVoucher

router.get('/history/voucher/item/:idGroupVoucher', async function (req, res, next) {
  try {
    let idGroupVoucher = req.params.idGroupVoucher;
    let status = req.query.status;
    let softDelete = 0;
    let q = req.query.q;

    let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive

    (idGroupVoucher == undefined || idGroupVoucher == '') ? idGroupVoucher = null : idGroupVoucher = idGroupVoucher;
    (status == undefined || status == '' || status == 0 || status == 1 || status == 2) ? status = { $gte: 3 } : status = status;


    //? Begin config Pagination
    let pagination = {
      currentPage: parseInt(req.query.page),
      totalItemsPerPage: parseInt(req.query.perPage)
    }

    const groupVoucherItems = await groupVoucherItemsModel
      .find(voucherItems(regex, softDelete, idGroupVoucher, status))
      .select({})
      .sort({ "idVoucher": -1 })
      .limit(pagination.totalItemsPerPage)
      .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);

    const countGroupVoucherItems = await groupVoucherItemsModel.countDocuments(voucherItems(regex, softDelete, idGroupVoucher, status));


    const typeClassifiedGroup = await groupVoucherModel.findOne({ idGroupVoucher: idGroupVoucher }).select({ classified: 1 });




    Promise.all([groupVoucherItems, countGroupVoucherItems, typeClassifiedGroup]).then(([groupVoucherItems, countGroupVoucherItems, typeClassifiedGroup]) => {
      return res.status(200).json({
        success: true,
        groupVoucherItems: groupVoucherItems,
        typeClassifiedGroup: typeClassifiedGroup,
        countGroupVoucherItems: countGroupVoucherItems,
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
// /* GET List Group Voucher listing. */
// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/list/voucher/item/:idGroupVoucher
// ? Example: http://localhost:1509/voucher/group/history/voucher/item/:idGroupVoucher

router.get('/history/trash/voucher/item/:idGroupVoucher', async function (req, res, next) {
  try {
    let idGroupVoucher = req.params.idGroupVoucher;
    let status = req.query.status;
    let softDelete = 1;
    let q = req.query.q;

    let regex = new RegExp(q, 'i');  // 'i' makes it case insensitive

    (idGroupVoucher == undefined || idGroupVoucher == '') ? idGroupVoucher = null : idGroupVoucher = idGroupVoucher;
    (status == undefined || status == '' || status == 0 || status == 1 || status == 2) ? status = { $gte: 3 } : status = status;


    //? Begin config Pagination
    let pagination = {
      currentPage: parseInt(req.query.page),
      totalItemsPerPage: parseInt(req.query.perPage)
    }

    const groupVoucherItems = await groupVoucherItemsModel
      .find(voucherItems(regex, softDelete, idGroupVoucher, status))
      .select({})
      .sort({ "idVoucher": -1 })
      .limit(pagination.totalItemsPerPage)
      .skip((pagination.currentPage - 1) * pagination.totalItemsPerPage);

    const countGroupVoucherItems = await groupVoucherItemsModel.countDocuments(voucherItems(regex, softDelete, idGroupVoucher, status));


    const typeClassifiedGroup = await groupVoucherModel.findOne({ idGroupVoucher: idGroupVoucher }).select({ classified: 1 });




    Promise.all([groupVoucherItems, countGroupVoucherItems, typeClassifiedGroup]).then(([groupVoucherItems, countGroupVoucherItems, typeClassifiedGroup]) => {
      return res.status(200).json({
        success: true,
        groupVoucherItems: groupVoucherItems,
        typeClassifiedGroup: typeClassifiedGroup,
        countGroupVoucherItems: countGroupVoucherItems,
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


// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/create
// ? Example: http://localhost:1509/voucher/group/create
router.post('/create/voucher', idAutoGroup, idAutoGroupVoucher, async function (req, res, next) {
  try {

    let obj = req.body;
    await obj.forEach(function (item, index) {
      item.idVoucher = AutoIdVoucher + index;
      item.idGroupVoucher = AutoId;
    })
    const entry = await groupVoucherItemsModel.insertMany(obj)
    return res.status(200).json({
      success: true,
      message: "Successfully Created",
      data: entry
    });
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
// -u http://localhost:1509/update/:id

router.post('/update/many/voucher/add/:id', updateVoucherAdd, idAutoGroupVoucher, async function (req, res, next) {
  try {
    let obj = req.body;
    let idGroupVoucher = req.params.id;
    await obj.forEach(function (item, index) {
      item.idVoucher = AutoIdVoucher + index;
      item.idGroupVoucher = idGroupVoucher;
    })

    const entry = await groupVoucherItemsModel.insertMany(obj)
    return res.status(200).json({
      success: true,
      message: "Successfully Created"
    });
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

router.patch('/delete/many/group', async function (req, res, next) {
  try {
    let obj = req.body.GroupIdArray;
    const entry = await groupVoucherModel.deleteMany({ _id: { $in: obj } }, (err, result) => {
      return res.status(200).json({
        success: true,
        message: "Deleted Groups Successfully"
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

router.patch('/delete-soft/many/group', async function (req, res, next) {
  try {
    let obj = req.body.GroupIdArray;
    const entry = await groupVoucherModel.updateMany({ _id: { $in: obj } }, {
      softDelete: 1
    }, (err, result) => {
      return res.status(200).json({
        success: true,
        message: "Delete Soft Groups Successfully"
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

router.patch('/restore/many/group', async function (req, res, next) {
  try {
    let obj = req.body.GroupIdArray;
    const entry = await groupVoucherModel.updateMany({ _id: { $in: obj } }, {
      softDelete: 0
    }, (err, result) => {
      return res.status(200).json({
        success: true,
        message: "Restore Groups Successfully"
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

router.patch('/delete/many/voucher', async function (req, res, next) {
  try {
    let obj = req.body.VoucherIdArray;
    const entry = await groupVoucherItemsModel.deleteMany({ _id: { $in: obj } }, (err, result) => {
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


/* PATCH todo listing change isStarred isComplete. */
// TODO: METHOD - PATCH
// -u http://localhost:1509/delete/many/voucher

router.patch('/delete-soft/many/voucher', async function (req, res, next) {
  try {
    let obj = req.body.VoucherIdArray;
    const entry = await groupVoucherItemsModel.updateMany({ _id: { $in: obj } }, {
      softDelete: 1
    }, (err, result) => {
      return res.status(200).json({
        success: true,
        message: "Delete Soft Successfully"
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

router.patch('/restore/many/voucher', async function (req, res, next) {
  try {
    let obj = req.body.VoucherIdArray;
    const entry = await groupVoucherItemsModel.updateMany({ _id: { $in: obj } }, {
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

router.patch('/change/status/many/voucher', async function (req, res, next) {
  try {
    let obj = req.body.VoucherIdArray;
    let status = req.query.status;
    const entry = await groupVoucherItemsModel.updateMany({ _id: { $in: obj } }, {
      status: status, modified: {
        modifyBy: "admin",
        time: Date.now()
      }
    }, (err, result) => {
      return res.status(200).json({
        success: true,
        message: "Changed Status Successfully"
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

/* DELETE todo listing deleteSoft Record */
// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/delete-soft/:id
// ? Example: http://localhost:1509/voucher/group/delete-soft/:
http://localhost:1509/voucher/group/voucher-items/delete-soft/6084a25a94ca7c92289c2bb0
router.delete('/voucher-items/delete-soft/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;
    const entry = await groupVoucherItemsModel.findOneAndUpdate({ _id: _id }, { softDelete: 1 });
    return res.status(200).json({
      success: true,
      message: "Deleted Soft Successfully"
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  };
});

/* DELETE todo listing deleteSoft Record */
// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/delete-soft/:id
// ? Example: http://localhost:1509/voucher/group/delete-soft/:
router.patch('/trash/voucher-items/restore/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;
    const entry = await groupVoucherItemsModel.findOneAndUpdate({ _id: _id }, { softDelete: 0 });
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


/* DELETE todo listing deleteSoft Record */
// TODO: METHOD - GET
// -u http://localhost:1509/voucher/group/delete-soft/:id
// ? Example: http://localhost:1509/voucher/group/delete-soft/:
router.delete('/trash/voucher-items/delete/:id', async function (req, res, next) {
  try {
    const _id = req.params.id;
    const entry = await groupVoucherItemsModel.findOneAndDelete({ _id: _id });
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






//! CODE API FOR PERMISSION EMPLOYEE

module.exports = router;
