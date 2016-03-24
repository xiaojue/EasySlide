/**
 * @author designsor@gmail.com
 * @date 20150810
 * @fileoverview 特效扩展
 */
(function(win) {

  var EasySlide = win.EasySlide;

  var utils = EasySlide.utils;

  utils.mixin(EasySlide.animationEffects, {
    'scale': function(ele, axis, offsetEnd, setTransition) {
      if (setTransition) {
        ele.style["-webkit-transition"] = this.transition;
      }
      var tIndex = parseInt(utils.attr(ele, 'index'), 10);
      var transform = 'translateZ(0) translate' + axis + '(' + offsetEnd + 'px)';
      if (this.curIndex !== tIndex) {
        transform += ' scale(0.5)';
      }
      ele.style["-webkit-transform"] = transform;
    },
    'flip': function(ele, axis, offsetEnd, setTransition) {
      if (setTransition) {
        ele.style["-webkit-transition"] = this.transition;
      }
      var rotateDirect = (axis === 'X') ? 'Y' : 'X';
      var tIndex = parseInt(utils.attr(ele, 'index'), 10);
      ele.style['-webkit-backface-visibility'] = 'hidden';
      ele.style['-webkit-transform-style'] = 'preserve-3d';
      ele.style.zIndex = tIndex;
      var eles = utils.getByTagName('*', ele);
      var duration = window.getComputedStyle(ele, null)['transition-duration'];
      duration = duration ? utils.transitionDurationToMilliseconds(duration) : 0;
      //有滚动条的容器，会对backface-visbility无效，需要做隐藏
      eles.forEach(function(ele) {
        if (utils.hasAttr(ele, 'scroll')) {
          utils.hide(ele);
        }
      });
      if (this.curIndex === tIndex) {
        ele.style.visibility = 'visible';
        ele.style['-webkit-transform'] = 'rotate' + rotateDirect + '(0deg) translateZ(0)';
      } else {
        ele.style.visibility = 'hidden';
        ele.style['-webkit-transform'] = 'rotate' + rotateDirect + '(180deg) translateZ(0)';
      }
      setTimeout(function() {
        eles.forEach(function(ele) {
          if (utils.hasAttr(ele, 'scroll')) {
            utils.show(ele);
          }
        });
      }, duration);
    },
    //x 效果好
    'rotate': function(ele, axis, offsetEnd, setTransition) {
      if (setTransition) {
        ele.style["-webkit-transition"] = this.transition;
      }
      var rotateDirect = (axis === 'X') ? 'Y' : 'X';
      var tIndex = parseInt(utils.attr(ele, 'index'), 10);
      var scale = axis === 'X' ? this.vW : this.vH;
      ele.style['-webkit-backface-visibility'] = 'hidden';
      ele.style['-webkit-transform-style'] = 'preserve-3d';
      ele.style.position = 'absolute';
      this.wrapAll.style.webkitPerspective = scale * 4;
      if (tIndex === this.curIndex) {
        ele.style.zIndex = 1;
        ele.style['-webkit-transform'] = 'rotate' + rotateDirect + '(0deg) translateZ(0) scale(1)';
      } else {
        var isNext = tIndex === this.curIndex + 1;
        var isEnd = this.curIndex === this.slidesLen - 1 && tIndex === 0;
        var index = isNext || isEnd ? 1 : -1;
        ele.style.zIndex = 0;
        ele.style['-webkit-transform'] = 'rotate' + rotateDirect + '(' + 90 * index + 'deg) translateZ(' + (0.888 * scale / 2) + 'px) translate' + axis + '(' + offsetEnd + 'px) scale(0.888)';
      }
    },
    'card': function(ele, axis, offsetEnd, setTransition) {
      if (setTransition) {
        ele.style["-webkit-transition"] = this.transition;
      }
      var tIndex = parseInt(utils.attr(ele, 'index'), 10);
      var transform = 'translateZ(0) translate' + axis + '(' + offsetEnd + 'px)';
      var duration = window.getComputedStyle(ele, null)['transition-duration'];
      duration = duration ? utils.transitionDurationToMilliseconds(duration) : 0;
      ele.style.position = 'absolute';
      if (tIndex === this.curIndex) {
        ele.style.zIndex = 1;
        ele.style["-webkit-transform"] = transform;
      } else {
        ele.style.zIndex = 0;
        setTimeout(function() {
          ele.style["-webkit-transform"] = transform;
        }, duration);
      }
    }
  });

})(window);
