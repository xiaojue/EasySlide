/**
 * @author designsor@gmail.com
 * @date 20150810
 * @fileoverview 子ppt功能
 */
(function(win, doc) {

  var EasySlide = win.EasySlide;

  var utils = EasySlide.utils;

  var Subppt = function(obj) {
    this.curIndex = 0;
    this.width = obj.width;
    this.height = obj.height;
    this.init(obj);
  };

  Subppt.STATIC = {
    slideCls: 'EasySlide-subppt-slide',
    imgWrapCls: 'EasySlide-subppt-imgWrap'
  };


  Subppt.prototype = {
    init: function(obj) {
      this.wrapDiv = utils.$(obj.wrapDiv);
      this.imgs = obj.imgs;
      this.slidesLen = this.imgs.length;
      this.initSlides(this.wrapDiv);
      utils.bind(win, "resize", this.resize.bind(this));
      this.showCurSlide();
    },
    resize: function() {
      this.initSlides(this.wrapDiv);
      var floorvW = this.floorvW.bind(this);
      var slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);
      slides.forEach(function(slide) {
        slide.style.width = floorvW(0.6) + "px";
      });
      this.showCurSlide();
    },
    setPos: function(el, posX, posY, scale) { //设置slide的水平方向位置
      posX = posX || 0;
      posY = posY || 0;
      var transform = "translate3d(" + posX + "px," + posY + "px,0)";
      if (scale) {
        transform += " scale3d(" + scale + "," + scale + ",1)";
      }
      el.style["-webkit-transform"] = transform;
    },
    createSlide: function(index) {
      var tDiv = doc.createElement("div");
      tDiv.className = Subppt.STATIC.slideCls;
      utils.attr(tDiv, "subindex", index);
      tDiv.style.width = this.floorvW(0.6) + "px";
      tDiv.innerHTML = "<div class='" + Subppt.STATIC.imgWrapCls + "'><img src='" + this.imgs[index] + "' /></div></div>";
      this.wrapDiv.appendChild(tDiv);
      return tDiv;
    },
    floorvW: function(num) {
      return Math.floor(this.vW * num);
    },
    showCurSlide: function() {
      var self = this,
        floorvW = self.floorvW.bind(this),
        hasCurEffect = [floorvW(0.2)],
        hasNext1Effect = [floorvW(0.9), floorvW(0.05), 0.8],
        hasNext2Effect = [self.vW + 150, floorvW(0.1), 0.7],
        hasPrev1Effect = [-floorvW(0.38), floorvW(0.05), 0.8],
        hasPrev2Effect = [-self.vW - 150, floorvW(0.1), 0.7],
        slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);

      var last1 = this.slidesLen - 1;
      var last2 = this.slidesLen - 2;
      var next1 = this.curIndex + 1;
      var next2 = this.curIndex + 2;
      var prev1 = this.curIndex - 1;
      var prev2 = this.curIndex - 2;

      var states = {
        hasCur: false,
        hasPrev1: false,
        hasPrev2: false,
        hasNext1: false,
        hasNext2: false
      };

      slides.forEach(function(slide) {

        var tIndex = parseInt(utils.attr(slide, "subindex"), 10);
        var isCur = tIndex === this.curIndex;
        var isNext = tIndex === next1;
        var isLast = (this.curIndex === last1 && tIndex === 0);
        var isNext2 = tIndex === next2;
        var isNextLast2 = (this.curIndex === last1 && tIndex === 1) || (this.curIndex === last2 && tIndex === 0);
        var isPrev = tIndex === prev1;
        var isFirst = (this.curIndex === 0 && tIndex === last1);
        var isPrev2 = tIndex === prev2;
        var isPrevFirst2 = (this.curIndex === 0 && tIndex === last2) || (this.curIndex === 1 && tIndex === last1);

        function setState(states) {
          var posArgs = [];
          for (var state in states) {
            if (states[state] === true) {
              switch (state) {
                case 'hasCur':
                  posArgs = [slide].concat(hasCurEffect);
                  break;
                case 'hasNext1':
                  posArgs = [slide].concat(hasNext1Effect);
                  break;
                case 'hasNext2':
                  posArgs = [slide].concat(hasNext2Effect);
                  break;
                case 'hasPrev1':
                  posArgs = [slide].concat(hasPrev1Effect);
                  break;
                case 'hasPrev2':
                  posArgs = [slide].concat(hasPrev2Effect);
                  break;
              }
              break;
            }
          }
          self.setPos.apply(self, posArgs);
        }

        var hasCur = isCur;
        var hasNext1 = isNext || isLast;
        var hasNext2 = isNext2 || isNextLast2;
        var hasPrev1 = isPrev || isFirst;
        var hasPrev2 = isPrev2 || isPrevFirst2;
        //局部的每次都做动画
        setState({
          hasCur: isCur,
          hasNext1: hasNext1,
          hasNext2: hasNext2,
          hasPrev1: hasPrev1,
          hasPrev2: hasPrev2
        });
        //全局只标记一次
        states.hasCur = states.hasCur ? states.hasCur : hasCur;
        states.hasNext1 = states.hasNext1 ? states.hasNext1 : hasNext1;
        states.hasNext2 = states.hasNext2 ? states.hasNext2 : hasNext2;
        states.hasPrev1 = states.hasPrev1 ? states.hasPrev1 : hasPrev1;
        states.hasPrev2 = states.hasPrev2 ? states.hasPrev2 : hasPrev2;

      }.bind(this));

      function createCur() {
        var tDiv = self.createSlide(self.curIndex);
        self.setPos.apply(self, [tDiv].concat(hasCurEffect));
      }

      function createNext1() {
        var tDiv = self.curIndex < last1 ? self.createSlide(next1) : self.createSlide(0);
        self.setPos.apply(self, [tDiv].concat(hasNext1Effect));
      }

      function createNext2() {
        var tDiv;
        if (self.curIndex < last2) {
          tDiv = self.createSlide(next2);
        } else if (self.curIndex === last2) {
          tDiv = self.createSlide(0);
        } else {
          tDiv = self.createSlide(1);
        }
        self.setPos.apply(self, [tDiv].concat(hasNext2Effect));
      }

      function createPrev1() {
        var tDiv = self.curIndex > 0 ? self.createSlide(prev1) : self.createSlide(last1);
        self.setPos.apply(self, [tDiv].concat(hasPrev1Effect));
      }

      function createPrev2() {
        var tDiv;
        if (self.curIndex > 1) {
          tDiv = self.createSlide(prev2);
        } else if (self.curIndex === 1) {
          tDiv = self.createSlide(last1);
        } else {
          tDiv = self.createSlide(last2);
        }
        self.setPos.apply(self, [tDiv].concat(hasPrev2Effect));
      }

      var createSlide = {
        hasCur: createCur,
        hasNext1: createNext1,
        hasNext2: createNext2,
        hasPrev1: createPrev1,
        hasPrev2: createPrev2
      };

      for (var i in states) {
        if (states.hasOwnProperty(i) && !states[i]) {
          createSlide[i]();
        }
      }
    },
    move: function(direction) {
      var slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);
      for (var i = 0, len = slides.length; i < len; i++) {
        var tIndex = parseInt(utils.attr(slides[i], "subindex"), 10);
        var delta = direction === 1 ? this.curIndex - tIndex : tIndex - this.curIndex;
        delta = delta > 0 ? delta : delta + this.slidesLen;
        if (delta === 2) {
          utils.remove(slides[i]); //删掉最左侧的隐藏slide，否则如果正好5张，动画会重叠，因为此时没有slide是隐藏的
          break;
        }
      }
      if (direction === 1) {
        this.curIndex++;
        if (this.curIndex >= this.slidesLen) {
          this.curIndex = 0;
        }
      } else {
        this.curIndex--;
        if (this.curIndex < 0) {
          this.curIndex = this.slidesLen - 1;
        }
      }
      this.showCurSlide();
    }
  };

  Subppt.prototype.initSlides = EasySlide.prototype.initSlides;

  EasySlide.prototype.initSubPPT = function(subpptObjects) {
    var self = this;

    function initSub(index, subpptObj) {
      self.subppt[index] = new EasySlide.Subppt({
        width: self.vW,
        height: self.vH,
        wrapDiv: subpptObj.wrapDiv,
        imgs: subpptObj.imgs
      });
      self.subpptNum.push(subpptObj.parentNum);
    }

    subpptObjects.forEach(function(subpptObj, index) {
      var tTarget = utils.$(subpptObj.wrapDiv);
      tTarget = utils.contain(tTarget, EasySlide.STATIC.flayerCls);
      if (tTarget) {
        var trigger = utils.$(utils.attr(tTarget, EasySlide.STATIC.flayerTriggerCls));
        utils.bind(trigger, "click", function() {
          initSub(index, subpptObj);
        });
      } else {
        initSub(index, subpptObj);
      }
    });
  };

  EasySlide.Subppt = Subppt;

})(window, document);
