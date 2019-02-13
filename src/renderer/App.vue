<template>
  <div id="app">
    <div class="drag"></div>
    <router-view></router-view>
  </div>
</template>

<script>
  import TitlebarWindows from 'electron-titlebar-windows'
  const { remote } = require('electron')
  export default {
    name: 'zeitraffer',
    created() {
      if(require('os').platform() == 'win32') {
        const titlebar = new TitlebarWindows({draggable: true, darkMode: true})
        titlebar.appendTo(document.body)
        titlebar.on('close', function(e) {
            remote.BrowserWindow.getFocusedWindow().close()
        });
        titlebar.on('minimize', function(e) {
            remote.BrowserWindow.getFocusedWindow().minimize()
        });
        titlebar.on('maximize', function(e) {
            remote.BrowserWindow.getFocusedWindow().setFullScreen(false)
        });
        titlebar.on('fullscreen', function(e) {
            remote.BrowserWindow.getFocusedWindow().setFullScreen(true)
        });
      }
    }
  }
</script>

<style <style lang="scss">
  /* CSS */
  html, body {
    height: 100%;
    width: 100%;
    padding: 0;
    margin: 0;
  }
  body {
    background: rgb(30, 30, 30);
    color: #fafafa;
    box-sizing: border-box;
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    border: 1px solid #111;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
  }
  .titlebar {
    display: block;
    height: 32px;
    padding: 5px;
    position: absolute;
    right: 0;
    top: 0;
    width: 100%;
  }
  #app {
    padding: 10px;
  }
  #app>.drag {
    width: 100%;
    overflow: hidden;
    height: 32px;
    -webkit-app-region: drag;
  }
</style>
