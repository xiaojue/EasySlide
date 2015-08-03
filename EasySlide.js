/*
 * @author zengshun 第一版
 * @author fuqiang3 第二版重构 -> 保留功能，全部优化+重新设计api
 * @date 20150730
 * @fileoverview 统一h5动画效果工具,不依赖zepto，用于h5 case by case业务
 */

(function(win, doc, undef) {

  var UA = navigator.userAgent;

  function noop() {}

  var utils = {
    $: function(id) {
      return doc.getElementById(id);
    },
    getByTagName: function(tag, ele) {
      ele = ele || doc;
      return utils.makeElesArray(ele.getElementsByTagName(tag));
    },
    getByClsName: function(cls, ele) {
      ele = ele || doc;
      return utils.makeElesArray(ele.getElementsByClassName(cls));
    },
    makeElesArray: function(eles) {
      return Array.prototype.slice.call(eles);
    },
    attr: function(ele, key, val) {
      if (val !== undef) {
        return ele.setAttribute(key, val);
      } else {
        return ele.getAttribute(key);
      }
    },
    bind: function(ele, eventType, func) {
      ele.addEventListener(eventType, func, false);
    },
    unbind: function(ele, eventType, func) {
      ele.removeEventListener(eventType, func, false);
    },
    viewData: function() {
      var w = win,
        body = doc.body,
        dd = doc.documentElement,
        W = w.innerWidth || dd.clientWidth || body.clientWidth || 0,
        H = w.innerHeight || dd.clientHeight || body.clientHeight || 0;
      return {
        "scrollTop": body.scrollTop || dd.scrollTop || w.pageYOffset,
        "scrollLeft": body.scrollLeft || dd.scrollLeft || w.pageXOffset,
        "documentWidth": Math.max(body.scrollWidth, dd.scrollWidth || 0),
        "documentHeight": Math.max(body.scrollHeight, dd.scrollHeight || 0, H),
        "viewWidth": W,
        "viewHeight": H
      };
    },
    remove: function(nid) {
      //删除某个节点
      if (nid && nid.nodeName) {
        nid.parentNode.removeChild(nid);
      }
    },
    hide: function(ele) {
      ele.style.display = 'none';
    },
    show: function(ele, flg) {
      ele.style.display = flg ? '' : 'block';
    },
    contain: function(ele, cls) {
      while (ele && ele.parentNode) {
        if (utils.hasClass(ele, cls)) {
          return ele;
        }
        ele = ele.parentNode;
      }
      return false;
    },
    hasClass: function(ele, cls) {
      return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    },
    isWeixn: function() {
      return UA.toLowerCase().match(/MicroMessenger/i) === "micromessenger" ? true : false;
    },
    mixin: function(sup, obj) {
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          sup[i] = obj[i];
        }
      }
      return sup;
    }
  };

  var Events = function() {
    this.map = {};
  };

  Events.prototype = {
    constructor: Event,
    trigger: function(eventname, args) {
      if (this.map[eventname]) {
        this.map[eventname].forEach(function(fn) {
          fn.apply(this, args);
        });
      }
    },
    on: function(eventname, callback) {
      if (this.map[eventname]) {
        this.map[eventname].push(callback);
      } else {
        this.map[eventname] = [callback];
      }
    }
  };

  var swipeEvent = function(ele) {
    this.startX = 0;
    this.startY = 0;
    this.lastX = 0;
    this.lastY = 0;
    Events.call(this);
    this.bindSwipe(ele);
  };

  swipeEvent.prototype = {
    constructor: swipeEvent,
    bindSwipe: function(ele) {
      utils.bind(ele, "touchstart", this._touchstart.bind(this));
      utils.bind(ele, "touchmove", this._touchmove.bind(this));
      utils.bind(ele, "touchend", this._touchend.bind(this));
    },
    _touchstart: function(e) {
      if (e.touches && e.touches.length > 1) {
        //这里只允许单指操作
        return false;
      }
      this.startX = this.lastX = e.touches[0].pageX;
      this.startY = this.lastY = e.touches[0].pageY;
    },
    _touchmove: function(e) {
      e.preventDefault();
      if (e.touches && e.touches.length > 1) {
        return false;
      }
      this.lastX = e.touches[0].pageX;
      this.lastY = e.touches[0].pageY;
    },
    _touchend: function() {
      var absX = Math.abs(this.lastX - this.startX);
      var absY = Math.abs(this.lastY - this.startY);

      var dragDirec = absX > absY ? "x" : "y";

      if ((dragDirec === "x" && absX < 30) || (dragDirec === "y" && absY < 30)) {
        return false;
      }

      if (dragDirec === "y") {
        this.trigger('swipeY');
      } else if (dragDirec === "x") {
        this.trigger('swipeX');
      }
    }
  };

  swipeEvent.prototype = utils.mixin(swipeEvent.prototype, Events.prototype);

  var EasySlide = function(config) {

    this.slides = [];
    this.slidesLen = 0;
    this.curIndex = 0;

    this.curGroups = [];
    this.curGLen = 0;
    this.curGIndex = 0;

    this.subppt = [];
    this.subpptNum = []; //哪些slide是有左右滑动的子ppt的
    this.firstTime = true; //是否是第一次浏览。如果是第一次，不能从第0张直接滑动看最后一张

    var defaultConfig = {
      resourceImg: [],
      resourceFoldUrl: '',
      loading: '',
      loadingWrap: '',
      wrapAll: '',
      arrow: '',
      shareWeiboBtn: '',
      shareCircleBtn: '',
      sharewxbg: ''
    };

    utils.mixin(defaultConfig, config);
    utils.mixin(this, defaultConfig);

    this.wrapAll = utils.$(this.wrapAll);
    swipeEvent.call(this, this.wrapAll);
    this.init();
  };

  EasySlide.STATIC = {
    flayerCls: 'flayer',
    flayerBtnCls: 'flayerbtn',
    flayerTriggerCls: 'triggerLayer',
    groupCls: 'groups',
    slideCls: 'slides'
  };

  EasySlide.prototype = {
    constructor: EasySlide,
    initSubPPT: function(subpptObjects) {
      var self = this;

      function initSub(index, subpptObj) {
        self.subppt[index] = new EasySlide.Subppt({
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
    },
    initLoading: function() {
      this.loading = utils.$(this.loading);
      this.loadingWrap = utils.$(this.loadingWrap);
    },
    bindEvent: function() {
      utils.bind(this.wrapAll, "click", this._click.bind(this));
      //绑在touchend上，操作才灵敏
      this.on('swipeY', this.allowSwipeY.bind(this));
      this.on('swipeX', this.allowSwipeX.bind(this));
      utils.bind(win, "load", this.resize.bind(this));
      utils.bind(win, "resize", this.resize.bind(this));
      utils.bind(win, "scroll", function(e) {
        e.preventDefault();
      });
    },
    initWeiXin: function() {
      var self = this;
      this.shareWeiboBtn = utils.$(this.shareWeiboBtn);
      utils.bind(this.shareWeiboBtn, "click", this.shareWeibo.bind(this));
      this.shareCircleBtn = utils.$(this.shareCircleBtn);
      if (utils.isWeixn()) { //如果是微信，显示分享到微信按钮
        this.sharewxbg = utils.$(this.sharewxbg);
        utils.bind(this.shareCircleBtn, "click", function() {
          utils.show(self.sharewxbg);
        });
        utils.bind(this.sharewxbg, "click", function() {
          utils.hide(self.sharewxbg);
        });
      } else {
        utils.remove(this.shareCircleBtn);
      }
    },
    init: function() {

      this.initLoading();
      this.retrieve();

      this.initSlides(this.wrapAll);

      this.slides = utils.getByClsName(EasySlide.STATIC.slideCls, this.wrapAll);
      this.slidesLen = this.slides.length;
      this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[0]);
      this.curGLen = this.curGroups.length;
      this.arrow = utils.$(this.arrow);
      this.showCurSlide();

      this.bindEvent();
      this.initWeiXin();

      if (this.subpptObjects) {
        this.initSubPPT(this.subpptObjects);
      }

    },
    initSlides: function(wrap) {
      this.vW = utils.viewData().viewWidth;
      this.vH = utils.viewData().viewHeight;
      wrap.style.height = this.vH + "px";
      wrap.style.width = this.vW + "px";
    },
    resize: function() {
      this.initSlides(this.wrapAll);
      this.showCurSlide();
    },
    setYPos: function(el, posY) { //设置slide的竖直方向位置
      el.style["-webkit-transform"] = "translate3d(0," + posY + "px,0)";
    },
    setAnimation: function(el, animation) {
      el.style["-webkit-animation"] = animation.name + " " + animation.duration + " " + animation.tfunction + " " + animation.delay + " " + animation.iteration + " normal forwards";
    },
    showCurSlide: function() {
      var self = this;
      var attr = utils.attr;
      this.slides.forEach(function(slide) {

        var tIndex = parseInt(utils.attr(slide, "index"), 10);
        var isEnd = self.curIndex === self.slidesLen - 1 && tIndex === 0;
        var isFirst = self.curIndex === 0 && tIndex === self.slidesLen - 1;
        var isCur = tIndex === self.curIndex;
        var isNext = tIndex === self.curIndex + 1;
        var isPrev = tIndex === self.curIndex - 1;
        var y = isCur ? 0 : null;

        if (isNext || isEnd) {
          y = self.vH;
        } else if (isPrev || isFirst) {
          y = -self.vH;
        }

        if (isCur || isNext || isPrev || isEnd || isFirst) {
          self.setYPos(slide, y);
          utils.show(slide, true);
        } else {
          //动画做完再隐藏
          utils.hide(slide);
          //多余的slide隐藏，这样始终保持最多3张显示
        }
      });

      this.curGroups.forEach(function(group) {
        var tIndex = parseInt(utils.attr(group, "gIndex"), 10);
        //处理当前slide下面的groups的展示
        if (tIndex === self.curGIndex) {
          utils.show(group);
          var animateDivs = utils.getByClsName("animate", group);
          animateDivs.forEach(function(div) {
            self.setAnimation(div, {
              name: attr(div, "in"),
              duration: attr(div, "duration") || ".5s",
              tfunction: attr(div, "tfunction") || "ease",
              delay: attr(div, "delay") || 0,
              iteration: attr(div, "iteration") || 1
            });
          });
        } else {
          //动画执行完毕再隐藏
          utils.hide(group);
        }
      });

      var allowswipe = utils.attr(this.curGroups[this.curGIndex], "allowswipe"); //获得该针是否允许上下滑动
      if (allowswipe === "no" || allowswipe === "prev") {
        utils.hide(this.arrow);
      } else {
        utils.show(this.arrow, true);
      }
    },
    allowSwipeY: function() {
      //获得该针是否允许上下滑动
      var allowswipe = utils.attr(this.curGroups[this.curGIndex], "allowswipe"); //获得该针是否允许上下滑动
      var direction = this.lastY < this.startY ? 1 : -1;
      if (!allowswipe || allowswipe === "next" || allowswipe === 'prev') {
        this.move(direction);
      }
    },
    allowSwipeX: function() {
      var subindex = this.subpptNum.indexOf(this.curIndex);
      if (subindex !== -1) { //如果此页有子ppt
        var direction = this.lastX < this.startX ? 1 : -1;
        this.subppt[subindex].move(direction);
      }
    },
    move: function(direction) {
      var directions = {
        '1': function() {
          if (this.curGIndex < this.curGLen - 1) {
            this.curGIndex++;
          } else {
            this.curIndex++;
            if (this.curIndex >= this.slidesLen) {
              this.curIndex = 0;
            }
            if (this.curIndex === this.slidesLen - 1) {
              this.firstTime = false; //看到最后一页了
            }
            this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[this.curIndex]);
            this.curGLen = this.curGroups.length;
            this.curGIndex = 0;
          }
        },
        '-1': function() {
          if (this.curGIndex > 0) {
            this.curGIndex--;
          } else {
            this.curIndex--;
            if (this.curIndex < 0) {
              if (this.firstTime) {
                this.curIndex = 0;
              } else {
                this.curIndex = this.slidesLen - 1;
              }
            }
            this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[this.curIndex]);
            this.curGLen = this.curGroups.length;
            this.curGIndex = this.curGLen - 1;
          }
        }
      };
      directions[direction].call(this);
      this.showCurSlide();
    },
    _click: function(e) {
      //处理各种逻辑，包括跳转、出浮层、浮层消失等
      var target = e.target;
      while (target && target.parentNode && target !== this.wrapAll) {
        if (utils.hasClass(target, "goto")) {
          //所有的大frame之间的跳转
          e.stopPropagation();
          var tGoIndex = parseInt(utils.attr(target, "goto"), 10);
          this.goto(tGoIndex);
          break;
        } else if (utils.hasClass(target, EasySlide.STATIC.flayerBtnCls)) {
          //所有点击出浮层
          e.stopPropagation();
          var tLayer = utils.$(utils.attr(target, "layerid"));
          utils.show(tLayer);
          break;
        } else if (utils.hasClass(target, EasySlide.STATIC.flayerCls)) {
          //浮层点击消失
          e.stopPropagation();
          utils.show(target, true);
          break;
        }
        target = target.parentNode;
      }
    },
    goto: function(index) {
      //直接跳转到某个大slide
      this.curIndex = index;
      //换大的slide了，自然需要换一组新的groups
      this.curGroups = utils.getByClsName(EasySlide.STATIC.groupCls, this.slides[this.curIndex]);
      this.curGLen = this.curGroups.length;
      this.curGIndex = 0;
      this.showCurSlide();
    },
    shareWeibo: function(e) {
      var wbTitle = doc.title;
      var shareImg = this.shareImg;
      var weiboreg = /weibo/i;
      e.stopPropagation();
      if (weiboreg.test(UA)) {
        /*
        WeiboJSBridge.invoke("openMenu", {}, function(params, success, code) {
          if (success) {
          } else {
            if (code === WeiboJSBridge.STATUS_CODE.NO_RESULT) {
              // do something.
            }
          }
        });
        */
        win.WeiboJSBridge.invoke("openMenu", {}, noop);
      } else {
        //wb_title为微博分享文案，share_img为分享图
        doc.location.href = 'http://share.sina.cn/callback?vt=4&title=' + encodeURIComponent(wbTitle) + '&pic=' + encodeURIComponent(shareImg) + '&url=' + encodeURIComponent(document.location.href);
      }
    },
    retrieve: function() {
      //加载资源loading界面
      var resourceImg = this.resourceImg,
        timg = [],
        successCount = 0,
        self = this,
        foldurl = this.resourceFoldUrl,
        resourceLen = resourceImg.length;
      resourceImg.forEach(function(img, index) {
        timg[index] = new Image();
        timg[index].onload = timg[index].onerror = function() {
          self.loading.innerHTML = (successCount / resourceLen * 100).toFixed(2) + "%";
          if (successCount === resourceLen) {
            self.hideloading();
          }
        };
        successCount++;
        timg[index].src = foldurl + img;
      });
    },
    hideloading: function() {
      //隐藏loading
      var self = this;
      this.setYPos(this.loadingWrap, -this.vH);
      setTimeout(function() {
        utils.hide(self.loadingWrap);
      }, 500);
    }
  };

  EasySlide.prototype = utils.mixin(EasySlide.prototype, swipeEvent.prototype);

  var Subppt = function(obj) {
    this.curIndex = 0;
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
      this.dotsWrap = utils.$(obj.dotsWrap);
      if (this.dotsWrap) {
        this.createDots();
      }
      utils.bind(win, "resize", this.resize.bind(this));
      this.showCurSlide();
    },
    createDots: function() {
      var tFrag = doc.createDocumentFragment();
      for (var i = 0; i < this.slidesLen; i++) {
        var tSpan = doc.createElement("span");
        tFrag.appendChild(tSpan);
      }
      this.dotsWrap.appendChild(tFrag);
    },
    resize: function() {
      this.initSlides(this.wrapDiv);
      var slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);
      slides.forEach(function(slide) {
        slide.style.width = Math.floor(this.vW * 0.6) + "px";
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
      tDiv.style.width = Math.floor(this.vW * 0.6) + "px";
      tDiv.innerHTML = "<div class='" + Subppt.STATIC.imgWrapCls + "'><img src='" + this.imgs[index] + "' /></div></div>";
      this.wrapDiv.appendChild(tDiv);
      return tDiv;
    },
    showDotes: function() {
      var self = this,
        spans = utils.getByTagName("span", this.dotsWrap);
      spans.forEach(function(span, i) {
        span.className = i === self.curIndex ? "on" : "";
      });
    },
    showCurSlide: function() {
      var self = this,
        tDiv,
        hasPrev1 = false,
        hasPrev2 = false,
        hasCur = false,
        hasNext1 = false,
        hasNext2 = false,
        slides = utils.getByClsName(Subppt.STATIC.slideCls, this.wrapDiv);

      function floorvW(num) {
        return Math.floor(self.vW * num);
      }

      slides.forEach(function(slide) {
        var tIndex = parseInt(utils.attr(slide, "subindex"), 10);
        var isCur = tIndex === this.curIndex;
        var last1 = this.slidesLen - 1;
        var last2 = this.slidesLen - 2;
        var isNext = tIndex === this.curIndex + 1;
        var isLast = (this.curIndex === last1 && tIndex === 0);
        var isNext2 = tIndex === this.curIndex + 2;
        var isNextLast2 = (this.curIndex === last1 && tIndex === 1) || (this.curIndex === last2 && tIndex === 0);
        var isPrev = tIndex === this.curIndex - 1;
        var isFirst = (this.curIndex === 0 && tIndex === last1);
        var isPrev2 = tIndex === this.curIndex - 2;
        var isPrevFirst2 = (this.curIndex === 0 && tIndex === last2) || (this.curIndex === 1 && tIndex === last1);

        var posArgs = [];

        if (isCur) {
          hasCur = true;
          posArgs = [floorvW(0.2)];
        } else if (isNext || isLast) {
          hasNext1 = true;
          posArgs = [floorvW(0.9), floorvW(0.05), 0.8];
        } else if (isNext2 || isNextLast2) {
          hasNext2 = true;
          posArgs = [this.vW + 150, floorvW(0.1), 0.7];
        } else if (isPrev || isFirst) {
          hasPrev1 = true;
          posArgs = [-floorvW(0.38), floorvW(0.05), 0.8];
        } else if (isPrev2 || isPrevFirst2) {
          hasPrev2 = true;
          posArgs = [-this.vW - 150, floorvW(0.1), 0.7];
        } else {
          utils.remove(slide);
        }

        if (posArgs.length) {
          posArgs.unshift(slide);
          this.setPos.apply(this, posArgs);
        }

      }.bind(this));

      if (!hasCur) { //如果没有当前图片，创建，并移动到合适的位置
        tDiv = this.createSlide(this.curIndex);
        this.setPos(tDiv, floorvW(0.2));
      }
      if (!hasNext1) {
        if (this.curIndex < this.slidesLen - 1) {
          tDiv = this.createSlide(this.curIndex + 1);
        } else {
          tDiv = this.createSlide(0);
        }
        this.setPos(tDiv, floorvW(0.9), floorvW(0.05), 0.8);
      }
      if (!hasNext2) {
        if (this.curIndex < this.slidesLen - 2) {
          tDiv = this.createSlide(this.curIndex + 2);
        } else if (this.curIndex === this.slidesLen - 2) {
          tDiv = this.createSlide(0);
        } else {
          tDiv = this.createSlide(1);
        }
        this.setPos(tDiv, (this.vW + 150), floorvW(0.1), 0.7);
      }
      if (!hasPrev1) {
        if (this.curIndex > 0) {
          tDiv = this.createSlide(this.curIndex - 1);
        } else {
          tDiv = this.createSlide(this.slidesLen - 1);
        }
        this.setPos(tDiv, -floorvW(0.38), floorvW(0.05), 0.8);
      }
      if (!hasPrev2) {
        if (this.curIndex > 1) {
          tDiv = this.createSlide(this.curIndex - 2);
        } else if (this.curIndex === 1) {
          tDiv = this.createSlide(this.slidesLen - 1);
        } else {
          tDiv = this.createSlide(this.slidesLen - 2);
        }
        this.setPos(tDiv, (-this.vW - 150), floorvW(0.1), 0.7);
      }
      if (this.dotsWrap) {
        this.showDotes();
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

  EasySlide.Subppt = Subppt;

  EasySlide.utils = utils;

  win.EasySlide = EasySlide;

})(window, document);
