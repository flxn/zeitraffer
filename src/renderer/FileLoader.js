var ExifImage = require('exif').ExifImage;

function FileLoader() {
}

FileLoader.prototype = {
    loadDir(directoryPath, cb) {
        let files = []
        fs.readdir(directoryPath, (err, dir) => {
            if(err) {
              console.error(err)
            } else {
              this.files = []
              for(let i = 0, l = dir.length; i < l; i++) {
                let fileName = dir[i];
                if(fileName[0] == '.') {
                  continue
                }
                let filePath = directoryPath + path.sep + fileName
                try {
                    new ExifImage({ image : filePath }, (error, exifData) => {
                        if (error) {
                            console.log('Error: '+error.message)
                        } else {
                            console.log(exifData) // Do something with your data!
                            files.push({
                              name: fileName,
                              path: filePath,
                              creationDate: exifData.exif.CreateDate,
                              width: exifData.exif.ExifImageWidth,
                              height: exifData.exif.ExifImageHeight,
                              aperture: exifData.exif.ApertureValue,
                              fnumber: exifData.exif.FNumber,
                              iso: exifData.exif.ISO,
                              shutterSpeed: exifData.exif.ShutterSpeedValue
                            })
                        }
                    })
                } catch (error) {
                    console.log('Error: ' + error.message);
                }
              }
            }
          })

    }
}

export default FileLoader
