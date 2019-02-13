<template>
    <div id="wrapper" v-loading.fullscreen.lock="fullscreenLoading" :element-loading-text="fullscreenLoadingMessage">
        <div v-show="files.length == 0">
            <div style="margin-top: 100px; width: 400px; margin-left: auto; margin-right: auto;">
                <img src="static/img/zrlogo.png" alt="electron-vue" style="width: 100%;">
            </div>
            <el-row>
                <el-col :span="6" :offset="9">
                    <el-button type="primary" @click="selectFiles" v-show="files.length == 0"
                               style="width:100%; margin-top: 20px;"><i class="el-icon-fa-folder-open"></i>
                        Select Folder
                    </el-button>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="8" :offset="8" style="text-align:center; margin-top: 10px; color: #eee; font-size: 14px;"
                        v-if="firstStart">
                    <span>Select the folder that contains the photos you want to use for your timelapse.</span>
                </el-col>
            </el-row>
        </div>
        <transition name="el-fade-in">
            <div v-show="files.length > 0">
                        <el-row>
                            <div id="logocontainer">
                                <img id="logo" src="static/img/zrlogo.png">
                            </div>
                        </el-row>

                        <el-row class="menu-row">
                            <el-col>
                                <el-button type="primary" class="hover-primary" style="width:200px" @click="selectFiles"><i
                                        class="el-icon-fa-folder-open"></i> Select Folder
                                </el-button>
                                <!--<el-button type="primary" style="width:200px" @click="selectFiles"><i class="el-icon-fa-bar-chart"></i> Analyze Photos</el-button>-->
                                <el-button type="success" class="hover-success" style="width:200px" @click="showExportDialog"
                                        v-show="files.length > 0"><i class="el-icon-fa-cog"></i> Generate Timelapse
                                </el-button>
                                <el-button type="primary" class="hover-primary" style="width:200px; float:right;"
                                        @click="showSettingsDialog"><i class="el-icon-fa-wrench"></i> Settings
                                </el-button>
                                <el-dropdown style="width:200px; float:right;" trigger="click" @command="openTool">
                                    <el-button type="primary" class="hover-primary" style="width:200px">
                                        <i class="el-icon-fa-rocket"></i> Tools
                                    </el-button>
                                    <el-dropdown-menu slot="dropdown" style="width:198px; border-radius:3px;">
                                        <el-dropdown-item command="timelapseCalculator"><i class="el-icon-fa-clock-o"></i>
                                            Timelapse Calculator
                                        </el-dropdown-item>
                                        <el-dropdown-item command="starTrailCalculator"><i class="el-icon-fa-star"></i>
                                            Star Trail Calculator
                                        </el-dropdown-item>
                                    </el-dropdown-menu>
                                </el-dropdown>
                            </el-col>
                        </el-row>
                
                        <el-row :gutter="10">
                            <el-col :span="16">
                                <el-table
                                        class="file-table"
                                        :data="files"
                                        v-on:row-click="handleRowClick"
                                        :highlight-current-row="true"
                                        max-height="350">
                                    <el-table-column prop="name" label="Name" width="320">
                                    </el-table-column>
                                    <el-table-column label="">
                                        <template slot-scope="scope">
                                            <div class="facts">
                                                <span v-if="scope.row.fnumber">f {{scope.row.fnumber}}</span>
                                            </div>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-col>
                            <el-col :span="8">
                                <el-alert
                                        title="Only JPG images are supported. All others files in the selected directory were ignored."
                                        type="error"
                                        v-show="showFileFormatWarning"
                                        style="margin-bottom: 10px">
                                </el-alert>
                                <div class="previewpanel">
                                    <span class="small-text">Preview</span>
                                    <el-row>
                                        <el-col class="buttons">
                                            <el-button size="small" @click="playPreview">
                                                <i class="el-icon-fa-play" :style="previewRunning ? 'color: #13ce66' : ''"></i>
                                            </el-button>
                                            <el-button size="small" @click="stopPreview">
                                                <i class="el-icon-fa-stop"></i>
                                            </el-button>
                                            <el-button v-show="previewImage" size="small" @click="openImageFile"
                                                    style="float:right">
                                                <i class="el-icon-fa-external-link"></i>
                                            </el-button>
                                        </el-col>
                                    </el-row>
                                    <div v-if="previewImage">
                                        <img :src="getPreviewDataString(previewImage)">
                                        <div class="facts">
                                            <span>{{previewImage.name}}</span>
                                            <span>{{previewImage.path}}</span>
                                        </div>
                                    </div>

                                </div>
                            </el-col>
                        </el-row>
                 
                    <el-row v-if="files.length > 0" style="margin-top: 20px">
                        <div class="facts">
                            <span>Directory: {{imageDirectory}}</span>
                            <span>Photos: {{files.length}} [{{fileType}}]</span>
                            <span>Duration: ~{{Math.round(files.length/30)}}s @ 30fps</span>
                        </div>
                    </el-row>
            </div>
        </transition>

        <!-- ####### -->
        <!-- Dialogs -->
        <!-- ####### -->

        <el-dialog class="export-dialog" title="Export Settings" :visible.sync="exportDialogVisible">
            <el-form ref="form" label-width="120px">
                <el-form-item label="Output Location">
                    <el-row style="margin:0">
                        <el-col :span="18">
                            <el-input v-model="savepath" :disabled="true"></el-input>
                        </el-col>
                        <el-col :span="5" :offset="1">
                            <el-button @click="selectSavePath"><i class="el-icon-fa-folder-open"></i></el-button>
                        </el-col>
                    </el-row>
                </el-form-item>
                <el-row>
                    <el-col :span="15">
                        <el-form-item label="Framerate">
                            <el-input-number v-model="outputFPS" :min="1" :max="120"></el-input-number>
                        </el-form-item>
                    </el-col>
                    <el-col :span="7" :offset="2">
                        <span style="line-height: 34px;"><i class="el-icon-fa-clock-o"></i> Clip: {{Number(this.files.length / outputFPS).toFixed(1)}}s</span>
                    </el-col>
                </el-row>
                <el-form-item label="Video Resolution">
                    <el-select v-model="outputResolutionPreset" @change="videoResolutionPresetChanged">
                        <el-option label="720p" value="720p"></el-option>
                        <el-option label="1080p" value="1080p"></el-option>
                        <el-option label="4K" value="4k"></el-option>
                        <el-option label="Same as image" value="same"></el-option>
                        <el-option label="Custom" value="custom"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="">
                    <el-row style="margin:0">
                        <el-col :span="11">
                            <el-input v-model="outputResolution.width">
                                <template slot="prepend"><span style="font-size: 12px">width</span></template>
                            </el-input>
                        </el-col>
                        <el-col :span="2" style="text-align:center">x</el-col>
                        <el-col :span="11">
                            <el-input v-model="outputResolution.height">
                                <template slot="prepend"><span style="font-size: 12px">height</span></template>
                            </el-input>
                        </el-col>
                    </el-row>
                </el-form-item>
                <el-alert
                        v-show="(outputResolution.width > 4096 || outputResolution.height > 2304) && !settings.use_h265"
                        type="warning"
                        title="Warning"
                        :closable="false"
                        style="margin-bottom: 20px"
                        description="Maximum supported resolution of x264 is 4096x2304. You can try to export the video but there could be playback issues. If you encounter problems select a different resolution or resize the images yourself. You can also try to activate H.265 encoding in the Settings menu.">
                </el-alert>
                <el-row>
                    <el-col :span="15">
                        <el-form-item label="Behaviour" v-if="outputResolutionPreset != 'same'">
                            <el-select v-model="scalingBehaviour" @change="scalingBehaviourChanged">
                                <el-option label="Resize &amp; Crop (keep Ratio)" value="resize_crop"></el-option>
                                <el-option label="Resize (ignore Aspect Ratio)" value="resize_ignore"></el-option>
                                <el-option label="Crop (Center)" value="crop"></el-option>
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" :offset="1">
                        <img id="resize-image" v-if="outputResolutionPreset != 'same'" :src="'static/img/icon_' + scalingBehaviour+ '.png'" width="100">
                    </el-col>
                </el-row>
                <el-row>
                    <el-col :span="10" :offset="6">
                        <span v-show="settings.use_h265"><i
                                class="el-icon-fa-compress"></i> Using the H.265 encoder</span>
                    </el-col>
                    <el-button type="primary" style="float:right" @click="generateTimelapse"
                               :disabled="savepath == '' || outputFPS == ''"><i class="el-icon-fa-cog"></i> Export
                    </el-button>
                    <div style="clear:both"></div>
                </el-row>
            </el-form>
        </el-dialog>
        <el-dialog class="copy-progress-dialog" title="Copy Progress" :show-close="false"
                   :close-on-click-modal="false" :close-on-press-escape="false" :visible.sync="copyProgressVisible">
            <div class="copyDial">
                <el-progress type="circle" :percentage="copyProgressPercentage"></el-progress>
            </div>
            <div class="debuglog" v-if="copyProgressMessage">
               Copying files to temporary location...
            </div>
        </el-dialog>
        <el-dialog class="export-progress-dialog" title="Export Progress" :show-close="false"
                   :close-on-click-modal="false" :close-on-press-escape="false" :visible.sync="exportProgressVisible">
            <div class="exportDial">
                <el-progress type="circle" :percentage="exportProgressPercentage"></el-progress>
            </div>
            <div class="debuglog" v-if="exportDebugMessage">
                <code>
                    {{exportDebugMessage}}
                </code>
            </div>
        </el-dialog>
        <el-dialog class="settings-dialog" title="General Settings" :visible.sync="settingsDialogVisible">
            <el-form ref="form">
                <el-form-item label="Use H.265 encoding (default: H.264)">
                    <el-switch v-model="settings.use_h265" @change="updateSettings('use_h265', $event)"></el-switch>
                </el-form-item>
                <el-form-item label="FFMPEG Preset (slower = better compression)">
                    <el-select v-model="settings.ffmpeg_preset" @change="updateSettings('ffmpeg_preset', $event)">
                        <el-option label="ultrafast" value="ultrafast"></el-option>
                        <el-option label="superfast" value="superfast"></el-option>
                        <el-option label="veryfast" value="veryfast"></el-option>
                        <el-option label="faster" value="faster"></el-option>
                        <el-option label="fast" value="fast"></el-option>
                        <el-option label="medium" value="medium"></el-option>
                        <el-option label="slow" value="slow"></el-option>
                        <el-option label="slower" value="slower"></el-option>
                        <el-option label="veryslow" value="veryslow"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button @click="openTempDir">View Temp Directory</el-button>
                </el-form-item>
                <el-form-item label="">
                    <el-button @click="resetElSettings">Reset electron-settings</el-button>
                </el-form-item>
            </el-form>
        </el-dialog>
        <!-- Timelapse Calculator -->
        <el-dialog class="timelapse-calculator-dialog" title="Timelapse Calculator"
                   :visible.sync="timelapseCalculatorVisible">
            <h2>What do you want to calculate?</h2>
            <el-radio-group v-model="timelapseCalculator.mode">
                <el-radio-button label="clip">Clip Length</el-radio-button>
                <el-radio-button label="event">Event Length</el-radio-button>
                <el-radio-button label="interval">Shooting Interval</el-radio-button>
            </el-radio-group>
            <hr style="margin: 15px 0;">
            <el-form ref="form" label-width="120px" style="margin-top:10px">
                <el-form-item label="Clip Length">
                    <el-input :disabled="timelapseCalculator.mode == 'clip'" v-model="timelapseCalculator.clipLength">
                        <el-select v-model="timelapseCalculator.clipLengthUnit" slot="append" placeholder="Select"
                                   style="width:110px">
                            <el-option label="Seconds" value="s"></el-option>
                            <el-option label="Minutes" value="m"></el-option>
                        </el-select>
                    </el-input>
                </el-form-item>
                <el-form-item label="Event Length">
                    <el-input :disabled="timelapseCalculator.mode == 'event'" v-model="timelapseCalculator.eventLength">
                        <el-select v-model="timelapseCalculator.eventLengthUnit" slot="append" placeholder="Select"
                                   style="width:110px">
                            <el-option label="Seconds" value="s"></el-option>
                            <el-option label="Minutes" value="m"></el-option>
                            <el-option label="Hours" value="h"></el-option>
                            <el-option label="Days" value="d"></el-option>
                        </el-select>
                    </el-input>
                </el-form-item>
                <el-form-item label="Shooting Interval">
                    <el-input :disabled="timelapseCalculator.mode == 'interval'" v-model="timelapseCalculator.shootingInterval">
                        <el-select v-model="timelapseCalculator.shootingIntervalUnit" slot="append" placeholder="Select"
                                   style="width:110px">
                            <el-option label="Seconds" value="s"></el-option>
                            <el-option label="Minutes" value="m"></el-option>
                            <el-option label="Hours" value="h"></el-option>
                        </el-select>
                    </el-input>
                </el-form-item>
                <el-form-item label="Target Framerate">
                    <el-input v-model="timelapseCalculator.targetFramerate"></el-input>
                </el-form-item>
                <el-form-item>
                    <span v-html="timelapseCalculator.resultText"></span>
                    <el-button type="primary" style="float:right" @click="calculateTimelapseSettings">Calculate</el-button>
                </el-form-item>

            </el-form>
        </el-dialog>
        <!-- Star Trail Calculator -->
        <el-dialog class="startrail-calculator-dialog" title="Star Trail Calculator"
                   :visible.sync="starTrailCalculatorVisible">
            <p>
                Due to the rotation of the earth, stars appear to be moving through the sky. A long exposure will therefore produce streaks (star trails) instead of single spot stars.<br>
                Sometimes this is a wanted effect but when shooting the Milky way you want the stars to be as round as possible.<br>
                This calculator will help you to find the best exposure time to maximize light collection while preventing star trails.<br>
            </p>
            <hr>
            <el-form ref="form" label-width="120px" style="margin-top:10px">
                <el-form-item label="Sensor Type">
                    <el-select v-model="starTrailCalculator.cropFactor" placeholder="Select">
                        <el-option label="Full Frame" :value="1"></el-option>
                        <el-option label="Canon APS-C" :value="1.6"></el-option>
                        <el-option label="General APS-C" :value="1.5"></el-option>
                        <el-option label="Four Thirds" :value="1.9"></el-option>
                    </el-select>
                </el-form-item>
                <el-form-item label="Focal Length">
                    <el-input v-model="starTrailCalculator.focalLength" style="width: 200px">
                        <template slot="append">mm</template>
                    </el-input>
                </el-form-item>
            </el-form>
            <p style="font-size: 18px">
                Maximum exposure time: <strong>{{Math.floor(500 / (parseInt(starTrailCalculator.focalLength) * starTrailCalculator.cropFactor)) || '?'}} seconds</strong>
            </p>
        </el-dialog>
    </div>
</template>

<script>
    const {dialog} = require('electron').remote
    const {spawn} = require('child_process')
    import fs from 'fs-extra'
    import tmp from 'tmp'
    import path from 'path'
    import {requireTaskPool} from 'electron-remote';

    var ExifParser = require('exif-parser')
    const electronSettings = require('electron').remote.require('electron-settings');
    import os from 'os'
import { resolve } from 'url';

    export default {
        name: 'main-view',
        components: {},
        data() {
            return {
                imageDirectory: '',
                files: [],
                previewImage: null,
                previewRunning: false,
                previewInterval: null,
                showFileFormatWarning: false,
                fullscreenLoading: false,
                fullscreenLoadingMessage: '',
                exportDialogVisible: false,
                outputFPS: 30,
                savepath: '',
                outputResolutionPreset: 'same',
                outputResolution: {width: 0, height: 0},
                scalingBehaviour: 'resize_crop',
                exportDebugMessage: '',
                exportProgressVisible: false,
                exportProgressPercentage: 0,
                copyProgressVisible: false,
                copyProgressPercentage: 0,
                copyProgressMessage: '',
                settingsDialogVisible: false,
                settings: {
                    use_h265: electronSettings.get('use_h265', false),
                    ffmpeg_preset: electronSettings.get('ffmpeg_preset', 'medium')
                },
                firstStart: electronSettings.get('first_start', true),
                timelapseCalculatorVisible: false,
                starTrailCalculatorVisible: false,
                starTrailCalculator: {
                    cropFactor: 1,
                    focalLength: 18
                },
                timelapseCalculator: {
                    mode: 'clip',
                    targetFramerate: 30,
                    clipLength: '',
                    clipLengthUnit: 's',
                    eventLength: '',
                    eventLengthUnit: 'm',
                    shootingInterval: '',
                    shootingIntervalUnit: 's',
                    resultText: ''
                }
            }
        },
        mounted() {
            electronSettings.set('first_start', false)
        },
        methods: {
            open(link) {
                this.$electron.shell.openExternal(link)
            },
            openTempDir() {
                this.$electron.shell.openExternal(os.tmpdir())
            },
            updateSettings(name, newVal) {
                electronSettings.set(name, newVal)
                this.settings[name] = newVal
            },
            openTool(name) {
                console.log(name)
                switch (name) {
                    case 'timelapseCalculator':
                        this.timelapseCalculatorVisible = true
                        break
                    case 'starTrailCalculator':
                        this.starTrailCalculatorVisible = true
                        break
                }
            },
            resetElSettings() {
                electronSettings.deleteAll()
            },
            calculateTimelapseSettings() {
                let timeToSecondFactor = { 's': 1, 'm': 60, 'h': 3600, 'd': 86400 }
                let resultInSeconds = 0
                let resultModeFull = ''
                switch (this.timelapseCalculator.mode) {
                    case 'clip':
                        resultInSeconds = Math.round(
                            (this.timelapseCalculator.eventLength * timeToSecondFactor[this.timelapseCalculator.eventLengthUnit]) /
                            ((this.timelapseCalculator.shootingInterval * timeToSecondFactor[this.timelapseCalculator.shootingIntervalUnit]) * this.timelapseCalculator.targetFramerate)
                        )
                        this.timelapseCalculator.clipLength = resultInSeconds
                        this.timelapseCalculator.clipLengthUnit = 's'
                        resultModeFull = 'Clip Length'
                        break;
                    case 'event':
                        resultInSeconds = Math.round(
                            (this.timelapseCalculator.clipLength * timeToSecondFactor[this.timelapseCalculator.clipLengthUnit]) *
                            (this.timelapseCalculator.shootingInterval * timeToSecondFactor[this.timelapseCalculator.shootingIntervalUnit]) * this.timelapseCalculator.targetFramerate
                        )
                        this.timelapseCalculator.eventLength = resultInSeconds
                        this.timelapseCalculator.eventLengthUnit = 's'
                        resultModeFull = 'Event Length'
                        break;
                    case 'interval':
                        resultInSeconds = (
                            (this.timelapseCalculator.eventLength * timeToSecondFactor[this.timelapseCalculator.eventLengthUnit]) /
                            (this.timelapseCalculator.clipLength * timeToSecondFactor[this.timelapseCalculator.clipLengthUnit])
                        ) / this.timelapseCalculator.targetFramerate
                        this.timelapseCalculator.shootingInterval = resultInSeconds
                        this.timelapseCalculator.shootingIntervalUnit = 's'
                        resultModeFull = 'Shooting Interval'
                        break;
                }


                let h = Math.floor(resultInSeconds / 3600)
                let m = Math.floor((resultInSeconds - h * 3600) / 60)
                let s = resultInSeconds - h * 3600 - m * 60
                if(h == 0 && m == 0 && Math.floor(s) == 0) {
                    this.timelapseCalculator.resultText = resultModeFull + ': <span style="font-size:18px"><sup>1</sup>&frasl;<sub>' + Math.round(1/s * 100)/100 + '</sub></span> s'
                } else {
                    this.timelapseCalculator.resultText = resultModeFull + ': ' + (h > 0 ? h + 'h ' : '') + (m > 0 ? m + 'm ' : '') + Math.round(s*100)/100 + 's'
                }
            },
            videoResolutionPresetChanged(val) {
                switch (val) {
                    case 'same':
                        this.outputResolution.width = this.files[0].exif.imageSize.width
                        this.outputResolution.height = this.files[0].exif.imageSize.height
                        break;
                    case '720p':
                        this.outputResolution.width = 1280
                        this.outputResolution.height = 720
                        break;
                    case '1080p':
                        this.outputResolution.width = 1920
                        this.outputResolution.height = 1080
                        break;
                    case '4k':
                        this.outputResolution.width = 3840
                        this.outputResolution.height = 2160
                        break;
                }
            },
            showSettingsDialog() {
                this.settingsDialogVisible = true
            },
            scalingBehaviourChanged() {
            },
            isJPEG(fileName) {
                let parsed = /\.(\w+)$/g.exec(fileName)
                return parsed === null || parsed[1].toLowerCase() === 'jpg' || parsed[1].toLowerCase() === 'jpeg'
            },
            selectFiles() {
                this.fullscreenLoadingMessage = 'Loading Photos...'
                this.fullscreenLoading = true
                let dialogPaths = dialog.showOpenDialog({
                    properties: ['openFile', 'openDirectory'],
                    filters: [
                        {name: 'All Files', extensions: ['*']}
                    ]
                })
                if (dialogPaths) {
                    let directoryPath = dialogPaths[0]
                    this.imageDirectory = directoryPath
                    this.showFileFormatWarning = false
                    console.log('Selected directory: ' + directoryPath)
                    fs.readdir(directoryPath, (err, dir) => {
                        if (err) {
                            console.error(err)
                        } else {
                            this.files = []
                            let imagesInQueue = dir.length
                            for (let i = 0, l = dir.length; i < l; i++) {
                                let fileName = dir[i];
                                if (fileName[0] == '.') {
                                    imagesInQueue--
                                    continue
                                }
                                let filetype = /\.(\w+)$/g.exec(fileName)[1]

                                if (filetype.toLowerCase() !== 'jpg' && filetype.toLowerCase() !== 'jpeg') {
                                    imagesInQueue--
                                    this.showFileFormatWarning = true
                                    setTimeout(() => {this.showFileFormatWarning = false}, 5000)
                                    continue
                                }
                                this.fileType = filetype
                                let filePath = directoryPath + path.sep + fileName

                                this.files.push({
                                    name: fileName,
                                    path: filePath,
                                    exif: null
                                })
                            }
                        }

                        this.fullscreenLoadingMessage = "Reading Metadata for Preview..."
                        let unprocessed = this.files.length
                        this.files.forEach(file => {
                            this.parseExifData(file.path, (err, exifData) => {
                                if (err) {
                                    console.log('Error reading exif data')
                                } else {
                                    file.exif = exifData
                                }

                                unprocessed--
                                if (unprocessed === 0) {
                                    this.fullscreenLoading = false
                                }
                            })
                        })
                    })

                } else {
                    console.log('No directory selected')
                }
            },
            getPreviewDataString(file) {
                if(this.previewRunning && file.exif && file.exif.hasThumbnail()) {
                    let b64encoded = btoa(String.fromCharCode.apply(null, file.exif.getThumbnailBuffer()));
                    return "data:image/jpg;base64," + b64encoded;
                }
                return "file://" + file.path
            },
            handleRowClick(row, event, column) {
                this.stopPreview()
                this.previewImage = row
                console.log(row)
            },
            playPreview() {
                this.previewRunning = true
                let i = 0
                this.previewInterval = setInterval(() => {
                    if (i < this.files.length) {
                        this.previewImage = this.files[i]
                        i++
                    } else {
                        clearInterval(this.previewInterval)
                        this.previewRunning = false
                    }
                }, 50)
            },
            stopPreview() {
                clearInterval(this.previewInterval)
                this.previewRunning = false
            },
            selectSavePath() {
                this.savepath = dialog.showSaveDialog({
                    filters: [
                        {name: 'Video File', extensions: ['mp4']}
                    ]
                })
            },
            showExportDialog() {
                this.exportDialogVisible = true
                this.outputResolution.width = this.files[0].exif.imageSize.width
                this.outputResolution.height = this.files[0].exif.imageSize.height
                this.videoResolutionPresetChanged()
            },
            generateTimelapse() {
                this.fullscreenLoadingMessage = "Copying files to temporary location..."
                this.fullscreenLoading = true
                let numDigitLen = Math.floor(Math.log10(this.files.length) + 1)
                tmp.setGracefulCleanup()
                //this.copyProgressVisible = true
                setTimeout(() => {
                    tmp.dir({prefix: 'zeitraffer_', unsafeCleanup: true}, (err, tmppath, cleanup) => {
                        if (err) throw err
                        console.log(tmppath)

                        let ffmpegOptions = [
                            '-y',
                            '-framerate', this.outputFPS,
                            '-i', path.resolve(tmppath, 'image%0' + numDigitLen + 'd.' + this.fileType),
                            '-c:v', this.settings.use_h265 ? 'libx265' : 'libx264',
                            '-preset', 'fast',
                            '-pix_fmt', 'yuv420p'
                        ]

                        if (!this.settings.use_h265) {
                            ffmpegOptions.push('-tune')
                            ffmpegOptions.push('stillimage')
                        }

                        if (this.outputResolutionPreset != 'same') {
                            ffmpegOptions.push('-filter:v')
                            switch (this.scalingBehaviour) {
                                case 'crop':
                                    ffmpegOptions.push('crop=' + this.outputResolution.width + ':' + this.outputResolution.height)
                                    break;
                                case 'resize_crop':
                                    ffmpegOptions.push('scale=' + this.outputResolution.width + ':-1, crop=' + this.outputResolution.width + ':' + this.outputResolution.height)
                                    //ffmpegOptions.push('-filter:v')
                                    //ffmpegOptions.push(')
                                    break;
                                case 'resize_ignore':
                                    ffmpegOptions.push('scale=' + this.outputResolution.width + ':' + this.outputResolution.height)
                                    break;
                            }

                        }

                        ffmpegOptions.push(this.savepath)
                        console.log(ffmpegOptions)

                        let copyBatchSize = 10
                        let copiesRunning = 0
                        let i = 0

                        console.log(this)

                        let copyFilter = (src, dest) => {
                            return this.isJPEG(src);
                        }

                        let copyFiles = new Promise((resolve, reject) => {
                            fs.copy(this.imageDirectory, tmppath, {filter: copyFilter}, err => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            })
                        })

                        copyFiles.then(() => {
                            
                            fs.readdirSync(tmppath).forEach((file, i) => {
                                console.log(i, file)
                                let padding = new Array(numDigitLen - (Math.floor(Math.log10(i + 1) + 1)) + 1).join(0)
                                fs.renameSync(path.resolve(tmppath, file), path.resolve(tmppath, 'image' + padding + (i + 1) + '.' + this.fileType))
                            })

                                let binaryName = 'ffmpeg-' + (os.platform() == 'win32' ? 'win' : os.platform() == 'darwin' ? 'osx' : 'linux') + (os.arch() == 'x64' ? '64' : '32')
                            console.log('binaries' + path.sep + binaryName, ffmpegOptions.join(' '))
                            const ffmpeg = spawn('binaries' + path.sep + binaryName, ffmpegOptions)

                            this.fullscreenLoading = false
                            this.exportDialogVisible = false
                            this.exportProgressVisible = true

                            ffmpeg.stdout.on('data', (data) => {
                                console.log(`stdout: ${data}`)
                            });

                            ffmpeg.stderr.on('data', (data) => {
                                let m = /frame=\s+(\d+)/g.exec(data.toString())
                                if (m && typeof m[1] !== "undefined") {
                                    this.exportDebugMessage = data.toString()
                                    this.exportProgressPercentage = Math.floor(m[1] / this.files.length * 100)
                                }
                                console.log(`stderr: ${data}`)
                            });

                            ffmpeg.on('close', (code) => {
                                this.exportProgressVisible = false
                                this.fullscreenLoading = false
                                if (code == 0) {
                                    this.$message.success('Timelapse saved')
                                } else {
                                    this.$message.error('An error occured saving the timelapse')
                                }
                                require('electron').shell.openExternal(this.savepath)
                                //clearTimeout(timeout)
                                console.log(`child process exited with code ${code}`)
                                cleanup()
                            });
                            
                        }, err => {
                            console.error(err)
                        })
                    })
                }, 500)

            },
            openImageFile() {
                require('electron').shell.openExternal(this.previewImage.path)
            },
            parseExifData(filePath, callback) {
                fs.open(filePath, 'r', (status, fd) => {
                    let buffer = new Buffer(65635)
                    fs.read(fd, buffer, 0, 65635, 0, (err, bytesRead, buff) => {
                        let parser = ExifParser.create(buff)
                        try {
                            var result = parser.parse();
                            callback(false, result)
                        } catch(err) {
                            console.log(err)
                            callback(true, null)
                        }
                    })
                })

            }

        }
    }
</script>

<style lang="scss">
    #logocontainer {
        width: 220px;
        margin-left: auto;
        margin-right: auto;
        margin-bottom: 30px;
    }

    #logo {
        height: auto;
        width: 100%;
    }

    .el-row {
        margin: 10px 0;
    }

    .file-table {
        background: rgb(42, 42, 42);
        color: #fff;
        border: none;
        font-size: 12px;
        width: 100%;
        overflow-y: auto;
    }

    .el-table tr {
        background: rgb(42, 42, 42) !important;
    }
/*
    .el-table th,
    .el-table__header-wrapper thead div,
    .el-table__footer-wrapper thead div {
        background-color: rgb(80, 80, 80);
        color: #fff;
    }

    table {
        border: none;
    }

    .el-table td {
        border-bottom: 1px solid rgb(60, 60, 60);
    }

    .el-table th {
        border: none !important;
    }

    .el-table::after,
    .el-table::before {
        background: none;
    }

    .el-table tr {
        background: inherit;
    }


    .el-table__body tr.current-row > td {
        background: rgb(80, 90, 80);
    }
*/
    .facts > span {
        font-size: 12px;
        display: block;
        width: 100%;
    }

    .el-table--enable-row-hover .el-table__body tr:hover > td {
        background: rgb(100, 100, 100);
    }

    .previewpanel {
        padding: 10px;
        background: rgb(80, 80, 80);
    }

    .previewpanel img {
        width: 100%;
        border: 1px solid #aaa;
    }

    .previewpanel .facts span {
        font-size: 10px;
    }

    .previewpanel i {
        color: #fff;
    }

    .previewpanel .buttons .el-button {
        background: transparent;
        margin-left: 0;
    }

    .small-text {
        font-size: 12px;
    }

    .full-width {
        width: 100%;
    }

    .debuglog {
        border-radius: 3px;
        margin-top: 30px;
        padding: 5px;

        background: #222;
        color: #13ce66;
    }

    .exportDial {
        width: 126px;
        margin: 0 auto;
    }

    .el-dropdown-menu {
        background: rgb(30, 30, 30);
        border: 1px solid rgb(100, 100, 100);
    }

    .menu-row {
        background: rgb(50, 50, 50);
    }

    .menu-row .el-button {
        background-color: transparent;
        border: none;
        border-radius: 0px;
        height: 40px;
    }

    .menu-row .el-button:hover {
        background-color: rgba(255, 255, 255, 0.3);
    }

    .hover-primary:hover {
        background-color: #32CCBC !important;
    }

    .hover-success:hover {
        background-color: #13ce66 !important;
    }

    .timelapse-calculator-dialog {
        top: 0;
        margin-bottom: 0;
    }

    .el-dialog {
        margin-top: 5vh !important;
    }
    
</style>
