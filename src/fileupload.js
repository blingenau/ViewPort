const BrowserWindow = require('electron').remote.BrowserWindow
const fileBtn = document.getElementById('new-file')

fileBtn.addEventListener('click', function(event){
  let win = BrowserWindow.getFocusedWindow()  // BrowserWindow in which to show the dialog
  const {dialog} = require('electron').remote
  arr = dialog.showOpenDialog({properties: ['openFile', 'openDirectory', 'multiSelections']})
  console.log("Filepath: ")
  console.log(arr[0])
  const fs = require('fs')

  fs.readFile(arr[0], 'Base64', (err, data) => {
    if (err) throw err
//  console.log(data)
  elt = document.getElementById("doc_insert2")
  console.log(elt)

  type = arr[0].split(".")[1]
  console.log(type)

  if (type == 'jpg' || type == 'png'){

    elt.innerHTML = "<img src = 'data:image/jpg;base64," + data + "'" + "height= '25' width='25' >"
  }
  else{
      elt.innerHTML = "<img src = 'word.png' height = '25' width = '25' >"
  }
  }); //fs.readFile

}); //fileBtn.addEventListener
