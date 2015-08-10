/**
 * @author designsor@gmail.com
 * @date 20150810
 * @fileoverview loader功能
 */
(function(win, doc) {

  var EasySlide = win.EasySlide;

  var utils = EasySlide.utils;

  function loader() {
    this.resources = {};
    this.audio = {};
    this.video = {};
  }

  loader.prototype = {
    constructor: loader,
    getFilename: function(url) {
      return url.slice(url.lastIndexOf('/') + 1).replace(/\?.*$/, '').toLowerCase();
    },
    getExtName: function(url) {
      return url.slice(url.lastIndexOf('.') + 1, url.length).toLowerCase();
    },
    getCreateNode: function(ext) {
      var types = {
        img: ['jpg', 'jpeg', 'gif', 'png', 'bmp']
          //,video: ['webm', 'mp4'],
          //audio: ['ogg', 'wav', 'mp3', 'aac']
      };
      for (var i in types) {
        if (types.hasOwnProperty(i) && types[i].indexOf(ext) > -1) {
          return i;
        }
      }
      return null;
    },
    _getResourcesMap: function(resources) {
      var self = this;
      resources.forEach(function(resource) {
        var fileName, fileExt, filePath;
        if (typeof resource === 'object') {
          fileName = resource.name;
          fileExt = self.getExtName(resource.path);
          filePath = resource.path;
        } else {
          fileName = self.getFilename(resource);
          fileExt = self.getExtName(resource);
          filePath = resource;
        }
        self.resources[fileName] = {
          path: filePath,
          name: fileName,
          type: fileExt,
          node: self.getCreateNode(fileExt)
        };
        if (self.resources[fileName].node === null) {
          throw new Error('load resource ext is not support' + fileExt + ',' + filePath);
        }
      });
    },
    _fetch: function(res, cb) {
      //var self = this,
      //name = res.name,
      var path = res.path,
        node = res.node;
      var Tag = doc.createElement(node);
      if (node === 'img') {
        Tag.onload = Tag.onerror = function() {
          utils.remove(Tag);
          cb();
        };
      }
      /*
      else {
        //TODO 加载音频视频功能在v2中开发
        utils.bind(Tag, 'canplaythrough', function() {
          if (node === 'video') {
            self.video[name] = Tag;
          } else {
            self.audio[name] = Tag;
          }
          cb();
        });
      }
      */
      Tag.style.display = 'none';
      Tag.src = path;
      doc.body.appendChild(Tag);
    },
    loader: function(resources) {
      var self = this,
        resourceLen = 0,
        successCount = 0;

      this._getResourcesMap(resources);
      resourceLen = Object.keys(this.resources).length;

      function callback() {
        successCount++;
        //console.log(successCount,resourceLen);
        self.trigger('progress', [(successCount / resourceLen * 100).toFixed(2)]);
        if (successCount === resourceLen) {
          self.trigger('loaded');
        }
      }
      for (var i in this.resources) {
        if (this.resources.hasOwnProperty(i)) {
          this._fetch(this.resources[i], callback);
        }
      }
    }
  };

  var oldInit = EasySlide.prototype.init;

  EasySlide.prototype.init = function() {
    loader.call(this);
    oldInit.call(this);
  };

  EasySlide.prototype = utils.mixin(EasySlide.prototype, loader.prototype);

})(window, document);
