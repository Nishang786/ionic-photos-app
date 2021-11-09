import { Component } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { UserPhoto, PhotoService } from '../services/photo.service';
import {OnInit} from '@angular/core'
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss']
})
export class Tab2Page implements OnInit {
  private ffile: File;
  constructor(public photoService: PhotoService,private http: HttpClient, public actionSheetController: ActionSheetController) {}

  async ngOnInit() {
    await this.photoService.loadSaved();
    let tempPkgId = {
      PkgId: 1
    }
    this.photoService.getDayWiseItinerary(tempPkgId).subscribe(respDayItineraryData => {
      console.log("respDayItineraryData", respDayItineraryData)
  })
  }
  onFileChange(fileChangeEvent) {
    this.ffile = fileChangeEvent.target.files[0];
  }
   
  async submitForm() {
    
    let formData = new FormData();
    formData.append("photo", this.ffile, this.ffile.name);
    this.http.post("http://localhost:3000/uploads", formData).subscribe((response) => {
      console.log(response);
    });
  }
 
}
