import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Storage } from '@capacitor/storage';
import { Platform } from '@ionic/angular';
import {HttpClient} from '@angular/common/http';
import { PhotoViewer } from '@ionic-native/photo-viewer/ngx';
import { finalize, map } from 'rxjs/operators';
import { ActionSheetController, ToastController, LoadingController } from '@ionic/angular';
import { AlertController} from '@ionic/angular';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  travUrl='https://www.travserver.com/';
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE: string = 'photos';
  file: any;
  
  constructor(//private photoViewer: PhotoViewer,
    private platform: Platform ,public http : HttpClient, private loadingController: LoadingController, private toastController: ToastController) {}

  public async loadSaved() {
    // Retrieve cached photo array data
    const photoList = await Storage.get({ key: this.PHOTO_STORAGE });
    this.photos = JSON.parse(photoList.value) || [];

    // If running on the web...
    if (!this.platform.is('hybrid')) {
      // Display the photo by reading into base64 format
      for (let photo of this.photos) {
        // Read each saved photo's data from the Filesystem
        const readFile = await Filesystem.readFile({
          path: photo.filepath,
          directory: Directory.Data,
        });
      
        // Web platform only: Load the photo as base64 data
        photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
      }
    }
    //this.photoViewer.show('https://mysite.com/path/to/image.jpg');
  }

  /* Use the device camera to take a photo:
  // https://capacitor.ionicframework.com/docs/apis/camera

  // Store the photo data into permanent file storage:
  // https://capacitor.ionicframework.com/docs/apis/filesystem

  // Store a reference to all photo filepaths using Storage API:
  // https://capacitor.ionicframework.com/docs/apis/storage
  */
  public async addNewToGallery() {
    // Take a photo
    const capturedPhoto = await Camera.getPhoto({
      resultType: CameraResultType.Uri, // file-based data; provides best performance
      source: CameraSource.Camera, // automatically take a new photo with the camera
      quality: 50, // highest quality (0 to 100)
      saveToGallery : true
    });

    const savedImageFile = await this.savePicture(capturedPhoto);

    // Add new photo to Photos array
    this.photos.unshift(savedImageFile);

    // Cache all photo data for future retrieval
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
    
    console.log(this.PHOTO_STORAGE)
  }

  // Save picture to file on device
  private async savePicture(cameraPhoto: Photo) {
    // Convert photo to base64 format, required by Filesystem API to save
    const base64Data = await this.readAsBase64(cameraPhoto);
    
    
    const fileName = new Date().getTime() + '.jpeg';
    console.log(fileName)
    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });
  
    if (this.platform.is('hybrid')) {
      // Display the new image by rewriting the 'file://' path to HTTP
      // Details: https://ionicframework.com/docs/building/webview#file-protocol
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    } else {
      // Use webPath to display the new image instead of base64 since it's
      // already loaded into memory
      return {
        filepath: fileName,
        webviewPath: cameraPhoto.webPath,
      };
    }
  }

  // Read camera photo into base64 format based on the platform the app is running on
  private async readAsBase64(cameraPhoto: Photo) {
    // "hybrid" will detect Cordova or Capacitor
    if (this.platform.is('hybrid')) {
      // Read the file into base64 format
      const file = await Filesystem.readFile({
        path: cameraPhoto.path,
      });

      return file.data;
    } else {
      // Fetch the photo, read as a blob, then convert to base64 format
      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();
      const formData = new FormData();
    const img = this.convertBlobToBase64(blob) as unknown as string
    formData.append('file', img);
    this.uploadImageData(formData);
      return (await this.convertBlobToBase64(blob)) as string;
    }
  }
  


  // Delete picture by removing it from reference data and the filesystem
  public async deletePicture(photo: UserPhoto, position: number) {
    // Remove this photo from the Photos reference data array
    this.photos.splice(position, 1);

    // Update photos array cache by overwriting the existing photo array
    Storage.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    // delete photo file from filesystem
    const filename = photo.filepath.substr(0,photo.filepath.lastIndexOf('/') + 1);
    console.log(filename)
    await Filesystem.deleteFile({
      path: filename,
      directory: Directory.Data,
    });
    
  }
  startUpload(photo: UserPhoto) {
    this.file.resolveLocalFilesystemUrl(photo.filepath)
        .then(entry => {
            ( < FileEntry > entry).file(file => this.readFile(file))
        })
        
}
  
  readFile() {
    // const reader = new FileReader();
    // reader.onload = () => {
    //     const formData = new FormData();
    //     const imgBlob = new Blob([reader.result], {
    //         type: file.type
    //     });
    //     formData.append('file', imgBlob, file.name);
    //     this.uploadImageData(formData);
    // };
    // reader.readAsArrayBuffer(file);
}
  convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        resolve(reader.result);
        
      };
    
      reader.readAsDataURL(blob);
      

    });

    async presentToast() {
      const toast = await this.toastController.create({
        message: 'File upload complete.',
        duration: 2000
      })};
      async presentToast1() {
        const toast = await this.toastController.create({
          message: 'File upload complete.',
          duration: 2000
        })};
    
    async uploadImageData(CData: FormData) {
      const loading = await this.loadingController.create({
          message: 'Uploading image...',
      });
      await loading.present();
   
      this.http.post("http://localhost:3000/uploads", { data: CData })
          .pipe(
              finalize(() => {
                  loading.dismiss();
              })
          )
          .subscribe(res => {
              if (res['success']) {
                  this.presentToast
              }
              else {
                this.presentToast1
              }
          });
  }
  getDayWiseItinerary(CData: any): Observable<any> {
    return this.http.post(this.travUrl + '/lead/insertDocumentData/', { data: CData })
      // eslint-disable-next-line arrow-body-style
      .pipe(map((res: any) => {
        return res;
      })
      );
  }
  

}
export interface UserPhoto {
  filepath: string;
  webviewPath: string;
}
