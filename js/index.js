var EventCenter = {
  on: function(type, handler){
    $(document).on(type, handler)
  },
  fire: function(type, data){
    $(document).trigger(type,data);
  }
};

var Footer = {
  init: function(){
    this.$footer = $('footer');
    this.$ul = this.$footer.find('ul');
    this.$leftBtn = this.$footer.find('.icon-back');
    this.$rightBtn = this.$footer.find('.icon-right');
    this.isLoadAnimate = false;
    this.isToBottom = false;
    this.isToStart = true;
    this.bind();
    this.render();
  },
  bind: function(){
    var _this = this;
    this.$rightBtn.on('click',function(){
      if(_this.isLoadAnimate) return;
      
      var coverWidth = _this.$ul.find('li').outerWidth(true);
      var rowCount = Math.floor(_this.$footer.find('.layout').width() / coverWidth);
      console.log('coverWidth',coverWidth);
      console.log('rowCount',rowCount);
      
      if(!_this.isToBottom){
        _this.isLoadAnimate = true;
        _this.$ul.animate({
          left: '-=' + rowCount * coverWidth
        },400,function(){
          _this.isLoadAnimate =false;
          _this.isToStart = false;
          if(parseInt(_this.$footer.find('.layout').width()) -parseInt(_this.$ul.css('left')) > parseInt(_this.$ul.css('width'))){
            console.log('toEND');
            _this.isToBottom = true;
          }
        });
      }
    });

    this.$leftBtn.on('click',function(){
      if(_this.isLoadAnimate) return;

      var coverWidth = _this.$ul.find('li').outerWidth(true);
      var rowCount = Math.floor(_this.$footer.find('.layout').width() / coverWidth);
      console.log('coverWidth',coverWidth);
      console.log('rowCount',rowCount);

      if(!_this.isToStart){
        _this.isLoadAnimate = true;
        _this.$ul.animate({
          left: '+=' + rowCount * coverWidth
        },400,function(){
          _this.isLoadAnimate =false;
          _this.isToBottom = false;
          if(parseInt(_this.$ul.css('left')) >= 0){
            _this.isToStart = true;
            console.log('toBEGIN');
          }
        });
      }
    });

    this.$footer.on('click', 'li', function(){
      $(this).addClass('active')
             .siblings().removeClass('active');
      
      EventCenter.fire('select-album',{
        channelId: $(this).attr('data-channel-id'),
        channelName: $(this).attr('data-channel-name')
      });
    });
  },
  render: function(){
    var _this = this;
    $.getJSON('https://jirenguapi.applinzi.com/fm/getChannels.php')
    .done(function(ret){
      // console.log(ret);
      _this.renderFooter(ret.channels);
    }).fail(function(){
      console.log('error');
    })
  },
  renderFooter: function(channels){
    // console.log(channels);
    var html = '';
    channels.forEach(function(elem){
      // <li class="cover active">
      //   <div style="background-image:url(img/IMG_0135.JPG)"></div>
      //   <h3>我的最爱</h3>
      // </li>
      html += '<li data-channel-id=' + elem.channel_id
            + ' data-channel-name=' + elem.name
            + ' class="cover"><div style="background-image:url('
            + elem.cover_small + ')"></div>'
            + '<h3>' + elem.name + '</h3>'
            + '</li>'
    });
    this.$ul.html(html);
    this.setStyle();
  },
  setStyle: function(){
    var count = this.$footer.find('li').length;
    var width = this.$footer.find('li').outerWidth(true);
    this.$ul.css({
      width: count * width + 'px'
    });
  }
}         

var Fm = {
  init: function(){
    this.$container = $('#page-music main');
    this.audio = new Audio();
    this.audio.autoplay = true;
    this.bind();
  },
  bind: function(){
    var _this = this;
    EventCenter.on('select-album',function(e,channel){
      //  console.log('channel',channel);
       _this.channelId = channel.channelId;
       _this.channelName = channel.channelName;
       _this.loadmusic();
    });

    this.$container.find('.music-panel .btn-play').on('click',function(){
      if($(this).hasClass('icon-stop')){
        $(this).removeClass('icon-stop').addClass('icon-play');
        _this.audio.pause();
      }
      else
      {
        $(this).removeClass('icon-play').addClass('icon-stop');
        _this.audio.play();
      }
    });

    this.$container.find('.music-panel .btn-next').on('click',function(){
      _this.loadmusic();
    });

    this.$container.find('.detail .bar').on('click',function(e){
      console.log('click');
      var percent = e.offsetX / parseInt(getComputedStyle(this).width);
      _this.audio.currentTime = percent * _this.audio.duration;
    });

    this.$container.find('.music-panel .btn-collect').on('click',function(){
      var $btn = $(this);
      if($btn.hasClass('active')){
        $btn.removeClass('active');
      }else{
        $btn.addClass('active');
      }
    });

    this.audio.addEventListener('play',function(){
      console.log('play');
      clearInterval(_this.statusClock);
      _this.statusClock = setInterval(function(){
        _this.updateStatue();
      },1000);
    });
    this.audio.addEventListener('pause',function(){
      clearInterval(_this.statusClock);
      console.log('pause');
    });
    this.audio.addEventListener('ended',function(){
      console.log('ended');
      _this.loadmusic();
    });
  },
  loadmusic: function(){
    var _this = this;
    $.getJSON('https://jirenguapi.applinzi.com/fm/getSong.php',{channel: this.channelId})
     .done(function(ret){
        // console.log(ret);
        _this.play(ret.song[0]);
     });
  },
  play: function(song){
    console.log(song);
    this.audio.src = song.url;
    this.$container.find('.icon-play').removeClass('icon-play').addClass('icon-stop');
    this.$container.find('.music-panel figure').css('background-image','url(' + song.picture + ')');
    $('.background').css('background-image','url(' + song.picture + ')');
    this.$container.find('.detail .tag').text(this.channelName);
    this.$container.find('.detail h1').text(song.title);
    this.$container.find('.detail .author').text(song.artist);

    this.loadLyric(song.sid);
  },
  updateStatue: function(){
    console.log('update');
    console.log('currentTime:',this.audio.currentTime);
    var min = Math.floor(this.audio.currentTime/60);
    var sec = Math.floor(this.audio.currentTime%60) + '';
    sec = sec.length ===2? sec : '0' + sec;
    this.$container.find('.detail .current-time').text(min + ':' + sec);
    this.$container.find('.detail .bar-progress').css('width',this.audio.currentTime/this.audio.duration*100 + '%');
    
    var line = this.lyricObj['0' + min + ':' + sec]
    if(line){
      this.$container.find('.detail .lyric p').text(line).boomText('rollIn');
    }
  },
  loadLyric: function(sid){
    var _this = this;
    // console.log('find lyric',sid);
    $.getJSON('https://jirenguapi.applinzi.com/fm/getLyric.php',{sid: sid})
     .done(function(ret){
      //  console.log('lyric',ret);
      //  var lyric = ret.lyric;
       var lyricObj = {};
      ret.lyric.split('\n').forEach(function(line){
        var times = line.match(/\d{2}:\d{2}/g);
        if(Array.isArray(times)){
          times.forEach(function(time){
            lyricObj[time] = line.replace(/\[.+?\]/g,'');
          });
        }
      });
      // console.log(lyricObj);
      _this.lyricObj = lyricObj;
     })
  }
}

$.fn.boomText = function(type){
  type = type || 'rollIn';
  this.html(function(){
    var arr = $(this).text().split('')
              .map(function(word){
                return '<span class="boomText">' + word + '</span>';
              });
    return arr.join('');
  });

  var index = 0;
  var $boomTexts = $(this).find('span');
  var clock = setInterval(function(){
    $boomTexts.eq(index).addClass('animated '+ type);
    index++;
    if(index >= $boomTexts.length){
      clearInterval(clock);
    }
  },200);

}

Footer.init();
Fm.init();