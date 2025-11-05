function createHttpRequest() {
  var xhr;
  // IE 浏览器的兼容性处理
  if (window.XMLHttpRequest) {
    xhr = new XMLHttpRequest();
  } else {
    // 兼容 IE 5,6
    xhr = new ActiveXObject("Microsoft.XMLHTTP");
  }

  function get(url, callback) {
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          callback(null, JSON.parse(xhr.responseText));
        } else {
          callback(new Error('Request failed with status:' + xhr.status));
        }
      }
    };
    xhr.send();
  }

  function post(url, data, callback) {
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          callback(null, JSON.parse(xhr.responseText));
        } else {
          callback(new Error('Request failed with status:' + xhr.status));
        }
      }
    };
    xhr.send(JSON.stringify(data));
  };

  function uploadDocument(url, data, callback) {
    xhr.open("POST", url, true);
    // xhr.setRequestHeader("Content-Type", "multipart/form-data");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status >= 200 && xhr.status < 300) {
          callback(null, JSON.parse(xhr.responseText));
        } else {
          callback(new Error('Request failed with status:' + xhr.status));
        }
      }
    };
    xhr.send(data);
  }

  // 示例
  // uploadDocument('http://localhost:3000/upload', { file: file }, function (error, response) {
  //   if (error) {
  //     console.error(error);
  //   } else {
  //     console.log('Upload Response:', response);
  //   }
  // });

  function abort() {
    xhr.abort();
  }

  return { get: get, post: post, uploadDocument: uploadDocument, abort: abort };
}

// 使用示例
// var request = createHttpRequest();

// // 发送 GET 请求
// request.get('http://jsonplaceholder.typicode.com/posts', function (error, response) {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log('GET Response:', response);
//   }
// });

// // 发送 POST 请求
// request.post('https://api.example.com/data', { key: 'value' }, function (error, response) {
//   if (error) {
//     console.error(error);
//   } else {
//     console.log('POST Response:', response);
//   }
// });
