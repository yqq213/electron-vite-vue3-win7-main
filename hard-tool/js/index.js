// _______________________________ 基准地址
// var baseUrl = 'http://172.16.3.21:8001'; //Qk
// var baseUrl = 'http://172.16.2.54:20090' //WT
// var baseUrl = 'http://59.36.171.126:20082'; //DEV
// var baseUrl = 'http://172.18.3.82:20082/prod-api'; //LiXin_env
var baseUrl = '/prod-api'

//电导分析仪1张  骨密度1张  人体成分1张  动脉硬化项目2张    心电图1张
// var _imageUrls = ['assets/doc/体检结果.png', 'assets/doc/体检结果2.png'] // 多张图片路径
// var _imageUrls = ['assets/doc/体检结果.png']; // 单张图片路径
// 通过IPC获取/lixin/assets/doc目录下的所有图片
var _imageUrls = [] // 多张图片路径

// 组合项目类型： 1 电导分析仪   2 骨密度  3 人体成分  4 动脉硬化   5 心电图
var _projectType = 1

// 默认医生姓名
var defaultDoctorName = ''

// 建议列表
var adviceList = []

// 配置文件中缓存deviceList
var deviceList = []

var http = createHttpRequest()

// 读取配置文件
window.ipcRenderer.invoke('read-config').then(function (config) {
  _projectType = config.defaultDeviceCode
  deviceList = config.deviceList
  for (var i = 0; i < config.deviceList.length; i++) {
    if (config.deviceList[i].deviceCode == _projectType) {
      defaultDoctorName = config.deviceList[i].doctorName
      adviceList = config.deviceList[i].adviceList
    }
  }
  // defaultDoctorName = config.deviceList
  // baseUrl = config.baseUrl
  // adviceList = config.adviceList || []
  init()
})

// // 动态加载 JavaScript 文件
// document.addEventListener('DOMContentLoaded', function () {
//   var xhr = new XMLHttpRequest()
//   xhr.open('GET', './config.json', true)
//   xhr.onreadystatechange = function () {
//     if (xhr.readyState === 4) {
//       if (xhr.status === 200) {
//         try {
//           var config = JSON.parse(xhr.responseText)
//           _projectType = config.device
//           defaultDoctorName = config.doctorName
//           baseUrl = config.baseUrl
//           adviceList = config.adviceList || []
//           init()
//         } catch (error) {
//           console.error('Error parsing config.json:', error)
//         }
//       } else {
//         console.error('Error loading config.json:', xhr.statusText)
//       }
//     }
//   }
//   xhr.send()
// })

function init() {
  // 通过IPC获取图片列表
  if (typeof window.ipcRenderer !== 'undefined') {
    window.ipcRenderer
      .invoke('read-dir', 'config/assets/doc')
      .then(function (imageUrls) {
        // for (var i = 0; i < imageUrls.length; i++) {
        //   _imageUrls.push(imageUrls[i].replace('config/', ''))
        // }
        _imageUrls = imageUrls
        // 继续其他初始化逻辑
        initializeComponents()
      })
      .catch(function (error) {
        console.error('获取图片列表失败:', error)
        // 如果获取失败，使用默认图片列表
        // _imageUrls = ['assets/doc/体检结果.png', 'assets/doc/体检结果2.png']
        initializeComponents()
      })
  } else {
    // 如果不在Electron环境中，使用默认图片列表
    // _imageUrls = ['assets/doc/体检结果.png', 'assets/doc/体检结果2.png']
    initializeComponents()
  }
}

function initializeComponents() {
  var searchEl = $$('#serialNumberEl')
  var formEl = $$('#formEl')
  var resultListEl = $$('#resultListEl')
  var saveBtnEl = $$('#saveBtnEl')
  var clearBtnEl = $$('#clearBtnEl')
  var checkDateEl = $$('#checkDateEl')
  var clearDiagnosisBtnEl = $$('#clearDiagnosisBtnEl')
  var searchBtnEl = $$('#searchBtnEl')
  var clearResultBtnEl = $$('#clearResultBtnEl')
  var imgCountEl = $$('#imgCountEl')
  var blobs = [] // 用于存储 Blob 对象

  // 鼠标默认定位到搜索框
  searchEl.focus()
  
  // 更新图片计数显示
  if (imgCountEl) {
    imgCountEl.innerText = _imageUrls.length
  }

  function renderAdvice() {
    // 根据adviceList动态渲染参考结果
    resultListEl.innerHTML = ''
    adviceList.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'resItem'
      div.innerHTML = '<i class="iconSmile"></i>' + item;
      resultListEl.appendChild(div)
    })
  }

  renderAdvice()

  // 切换所选组合项目
  formEl.type.onchange = function () {
    for (var i = 0; i < deviceList.length; i++) {
      if (deviceList[i].deviceCode == formEl.type.value) {
        defaultDoctorName = deviceList[i].doctorName
        formEl.doctorName.value = defaultDoctorName
        adviceList = deviceList[i].adviceList
        renderAdvice()
      }
    }
  }

  // 初始检查日期
  checkDateEl.value = getFormattedDate()
  // 本地保存检查医生
  formEl.doctorName.value = localStorage.getItem('doctorName') || defaultDoctorName
  imgCountEl.innerText = _imageUrls.length
  formEl.type.value = _projectType
  function getUserDateFn(query) {
    if (query) {
      clearFn()
      // console.log("searchEl", formEl.type.value)
      // return void 0;
      // 获取表单数据
      http.get(
        baseUrl + '/api/inspectionResults/getUserInfo/' + query + '?t=' + new Date().getTime(),
        function (error, response) {
          if (error) {
            console.error(error)
            showTooltip('获取用户信息失败！', 'error')
          } else {
            if (response.code === 200) {
              if (response.data.name) {
                showTooltip('查询用户信息成功！', 'success')
                inputDataFn(response.data)
              } else {
                showTooltip('未查询到信息！', 'warning')
              }
            } else {
              showTooltip('查询用户信息失败！', 'error')
            }
          }
        }
      )
    }
  }
  searchBtnEl.addEventListener('click', function () {
    getUserDateFn(serialNumberEl.value)
  })
  // 监听搜索框
  searchEl.addEventListener('keyup', function (e) {
    if (e.keyCode === 13) {
      getUserDateFn(e.target.value)
    }
  })
  // 填充表单数据
  var inputDataFn = function (data) {
    // console.log("@@@@@@@@", data)
    var inputData = data
    //  0男 1女
    // console.log(inputData)
    var sex = inputData.sex == '0' ? '男' : inputData.sex == '1' ? '女' : ''
    formEl.healthNo.value = inputData.healthNo
    formEl.name.value = inputData.name
    formEl.sex.value = sex
    formEl.age.value = inputData.age
    // formEl.workUnit.value = inputData.workUnit
    // formEl.type.value = inputData.type;
    return inputData
  }
  // 监听点击参考结果填充结果
  resultListEl.addEventListener('click', function (e) {
    formEl.remark.value = formEl.remark.value + e.target.textContent
  })
  // 清除表单数据
  clearBtnEl.addEventListener('click', function () {
    clearFn()
  })
  // 保存表单数据
  saveBtnEl.addEventListener('click', function (e) {
    e.preventDefault()
    if (!formEl.healthNo.value) {
      showTooltip('请先填写人员信息', 'warning')
      return void 0
    }
    // 先去上传图片
    // createObjectURL()
    uploadImgHandelFn()
  })

  function saveSubmitFn(data) {
    // console.log('🎉🎉🎉-data', data);
    var urlSplit = ''
    var ossIdSplit = ''
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        urlSplit += data[i].url + ','
        ossIdSplit += data[i].ossId + ','
      }
    }
    var formElNew = $$('#formEl')
    var submitData = {
      healthNo: formElNew.healthNo.value,
      name: formElNew.name.value,
      age: formElNew.age.value,
      sex:
        formElNew.sex.value == '男'
          ? '0'
          : formElNew.sex.value == '女'
            ? '1'
            : '',
      // workUnit: formElNew.workUnit.value,
      // examTimes: formElNew.examTimes.value,
      type: formElNew.type.value,
      ossId: ossIdSplit,
      ossUrl: urlSplit,
      // "proId": "项目id",
      typeName: formElNew.result.value,
      remark: formElNew.remark.value,
      doctorName: formElNew.doctorName.value
      // "serialNumber": formEl.serialNumber.value
    }
    localStorage.setItem('doctorName', formElNew.doctorName.value)
    if (submitData.ossUrl == '') {
      showTooltip('请先上传检查报告！', 'warning')
      return void 0
    }
    // 发送保存请求
    http.post(
      baseUrl + '/api/inspectionResults/saveHardwareScanner',
      submitData,
      function (error, response) {
        if (error) {
          showTooltip('保存失败！' + response.msg, 'error')
          console.error(error)
        } else {
          console.log('POST Response:', response)
          if (response.code === 200) {
            showTooltip('保存成功！', 'success')
            clearFn()
            window.location.href = 'success.html'
          } else {
            showTooltip('保存失败！' + response.msg, 'error')
          }
        }
      }
    )
  }

  // 清除表单数据
  function clearFn() {
    formEl.reset()
    checkDateEl.value = getFormattedDate()
    blobs = []
    formEl.type.value = _projectType
    formEl.doctorName.value = localStorage.getItem('doctorName') || ''
    formEl.doctorName.value =
      localStorage.getItem('doctorName') || defaultDoctorName
  }

  // 清除诊断
  clearDiagnosisBtnEl.addEventListener('click', function () {
    formEl.remark.value = ''
  })
  // 清除结果
  clearResultBtnEl.addEventListener('click', function () {
    formEl.result.value = ''
  })
  // *——————————————静默上传图片文件————————————————————
  // 多个图片上传
  function uploadImgHandelFn() {
    blobs = [] // 重置 blobs 数组
    // 创建图片加载计数器
    var loadedCount = 0
    for (let i = 0; i < _imageUrls.length; i++) {
      let img = new Image()
      img.src = _imageUrls[i]
      img.onload = function () {
        console.log('图片加载成功', i, this.src)
        getImgSrc(this.src)
        loadedCount++
        // 检查是否所有图片都已加载完成
        if (loadedCount === _imageUrls.length) {
          console.log('所有图片加载完成')
        }
      }
      img.onerror = function () {
        console.log('图片加载失败', i, this.src)
        loadedCount++
        // 即使加载失败也继续处理其他图片
        if (loadedCount === _imageUrls.length) {
          console.log('所有图片处理完成（部分可能失败）')
        }
      }
    }
  }
  // 获取本地图片的 URL
  function getImgSrc(src) {
    var xhr = new XMLHttpRequest()
    xhr.open('GET', src, true)
    xhr.responseType = 'blob'
    xhr.onload = function () {
      // console.log('🎉🎉🎉-xhr.status', xhr.status);
      blobs.push(xhr.response)
      // 当加载两个 Blob 后一起上传
      if (blobs.length === _imageUrls.length) {
        uploadImage(blobs) // 传递 Blob 数组
      }
      // if (xhr.status === 200) {  }
    }
    xhr.send()
  }

  // 上传图片函数
  function uploadImage(response) {
    var formData = new FormData()
    for (var i = 0; i < response.length; i++) {
      var blob = response[i] // 获取 Blob 对象
      formData.append('files', blob, 'image.png')
    }
    var uploadXhr = new XMLHttpRequest()
    // uploadXhr.open('POST', 'http://localhost:3000/upload', false); // 替换为实际的上传接口
    uploadXhr.open('POST', baseUrl + '/api/inspectionResults/lxUpload', false) // 替换为实际的上传接口
    uploadXhr.onload = function () {
      if (uploadXhr.status === 200) {
        var response = JSON.parse(uploadXhr.responseText)
        if (response.code === 200) {
          showTooltip('文件上传成功！', 'success')
          // console.log('文件上传成功:', uploadXhr.responseText);
          saveSubmitFn(response.data)
        } else {
          showTooltip('文件上传失败！', 'error')
          console.error('文件上传失败:', uploadXhr.statusText)
        }
      } else {
        showTooltip('文件上传失败！', 'error')
        console.error('文件上传失败:', uploadXhr.statusText)
      }
    }
    uploadXhr.send(formData)
  }
}
