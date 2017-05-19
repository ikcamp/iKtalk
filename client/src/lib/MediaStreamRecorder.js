// 设置媒体约束，接收声音和视频，视频宽度为320像素
var CONSTRAINTS = { audio: true, video: { width: 320 } }

export default class MediaStreamRecorder {

  constructor(stream) {
    this.stream = stream
    this.mediaSource = new MediaSource()  // 创建媒体数据源
    // 添加媒体数据源打开时的监听
    this.mediaSource.addEventListener('sourceopen', this.handleSourceOpen, false)
    this.mediaRecorder = null
    this.recordedBlobs = null
    this.sourceBuffer = null
  }

  getUserMedia(constraints = CONSTRAINTS) {
    return new Promise((resolve, reject)=>{
      console.debug('get user media...', constraints)
      // 获取用户媒体
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        console.debug('get user media success')
        this.stream = stream
        resolve(stream)
      }).catch(error=>{
        console.log('获取用户媒体错误: ', error)
        reject(error)
      })
    })
  }

  /**
   * 处理媒体源打开
   *
   * @param {any} event
   */
  handleSourceOpen(event) {
    this.sourceBuffer = this.mediaSource.addSourceBuffer('video/webm; codecs="vp8"')
  }

  /**
   * 处理数据可用
   * 
   * @param {any} event 
   */
  handleDataAvailable(event) {
    if (event.data && event.data.size > 0) {
      // 将数据追加到录制记录中
      this.recordedBlobs.push(event.data)
      this.onDataAvailable(event.data)
    }
  }

  onDataAvailable(data) {}

  // 开始录制
  start(interval = 3000) {
    console.debug('start record')
    this.recordedBlobs = [];  // 数据记录初始化
    var mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8',
      'video/webm']
    // 查找支持的视频格式
    var mimeType = mimeTypes.find(type=>MediaRecorder.isTypeSupported(type)) || ''
    try {
      // 创建媒体录制器
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
    } catch (e) {
      console.error('创建媒体录制器异常')
      return
    }
    this.mediaRecorder.ondataavailable = this.handleDataAvailable.bind(this)
    this.mediaRecorder.start(interval)
  }

  /**
   * 停止录制
   */
  stop() {
    console.debug('stop record')
    this.mediaRecorder.stop()
    var buf = new Blob(this.recordedBlobs, { type: 'video/webm' })
  }
}