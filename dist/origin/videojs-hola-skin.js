(function(window, vjs){
'use strict';

// helpers

function add_css(url, ver){
    var link = document.createElement('link');
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', url+(ver ? '?'+ver : ''));
    document.getElementsByTagName('head')[0].appendChild(link);
}

function get_class_name(element){
    return element.className.split(/\s+/g);
}

function add_class_name(element, class_name){
    var classes = get_class_name(element);
    if (classes.indexOf(class_name)==-1)
    {
        classes.push(class_name);
        element.className = classes.join(' ');
        return true;
    }
    return false;
}

function remove_class_name(element, class_name){
    var classes = get_class_name(element);
    var class_index = classes.indexOf(class_name);
    if (class_index>=0)
    {
        classes.splice(class_index, 1);
        element.className = classes.join(' ');
    }
}

// main skin code

var HolaSkin = function(video, opt){
    var _this = this;
    this.vjs = video;
    this.el = video.el();
    this.opt = opt;
    this.intv = 0;
    this.stagger = 3;
    this.steptotal = 5;
    this.classes_added = [];
    this.vjs.on('dispose', function(){ _this.dispose(); });
    this.vjs.on('ready', function(){ _this.init(); });
    this.apply();
};

HolaSkin.prototype.apply = function(){
    var c, classes = [this.opt.className];
    if (this.opt.show_controls_before_start)
        classes.push('vjs-show-controls-before-start');
    while ((c = classes.shift()))
    {
        if (add_class_name(this.el, c))
            this.classes_added.push(c);
    }
};

// XXX michaelg: taken from mp_video.js but play mode adjusted 2px right
// play/pause curves and transform
var play1 = 'M 21.5,18 32,25 21.5,32 21.5,32 Z';
var play2 = 'M 19.5,18 22.5,18 22.5,32 19.5,32 Z';
var pause1 = 'M 21.5,18 24.5,25 24.5,25 21.5,32 Z';
var pause2 = 'M 27.5,18 30.5,18 30.5,32 27.5,32 Z';
var replay = 'M8.661,0.001c0.006,0,0.01,0,0.01,0c0.007,0,0.007,0,0.011,'
    +'0c0.002,0,0.007,0,0.009,0 c0,0,0,0,0.004,0c0.019-0.002,0.027,0,0.'
    +'039,0c2.213,0,4.367,0.876,5.955,2.42l1.758-1.776c0.081-0.084,0.209'
    +'-0.11,0.314-0.065c0.109,0.044,0.186,0.152,0.186,0.271l-0.294,6.066h'
    +'-5.699c-0.003,0-0.011,0-0.016,0c-0.158,0-0.291-0.131-0.291-0.296 '
    +'c0-0.106,0.059-0.201,0.146-0.252l1.73-1.751c-1.026-0.988-2.36-1.529'
    +'-3.832-1.529c-2.993,0.017-5.433,2.47-5.433,5.51 c0.023,2.978,2.457,'
    +'5.4,5.481,5.422c1.972-0.106,3.83-1.278,4.719-3.221l2.803,1.293l-0.019'
    +',0.039 c-1.92,3.713-4.946,5.277-8.192,4.944c-4.375-0.348-7.848-4.013'
    +'-7.878-8.52C0.171,3.876,3.976,0.042,8.661,0.001z';
var morph_html = [
    '<svg height="3em" width="3em" viewBox="10 10 30 30">',
        '<g id="move">',
            '<g id="morph">',
                '<path d="M 19.5,18 22.5,18 22.5,32 19.5,32 Z"/>',
                '<path d="M 27.5,18 30.5,18 30.5,32 27.5,32 Z"/>',
            '</g>',
            '<use xlink:href="#morph" x="-30" y="0"/>',
        '</g>',
    '</svg>'].join('');
var umorph_html = [
    '<svg width="100%" height="100%" viewBox="10 10 30 30">',
        '<use id="umorph" xlink:href="#morph" x="0" y="0"/>',
    '</svg>'].join('');

var volume_icon_svg = '<svg height="3em" width="3em" viewBox="-6 -6 30 30">'
    +'<polygon points="10,0 10,18 4.5,13 0,13 0,5 4.5,5"/>'
    +'<polygon class="volume-level-0" points="20.5,6.2 19.1,4.8 16.2,7.6 13.4,4.8 12,6.2 14.8,9 12,11.8 13.4,13.2 16.2,10.4 19.1,13.2 20.5,11.8 17.7,9"/>'
    +'<g>'
        +'<path class="volume-level-1" d="M 13.6,6.3 L 12,7.7 C 12.3,8,12.5,8.5,12.5,9 s -0.2,1 -0.5,1.3 l 1.6,1.3 c 0.6 -0.7,1 -1.6,1 -2.7  C 14.6,8,14.2,7.1,13.6,6.3 z"/>'
        +'<path class="volume-level-2" d="M 16.8,3.7 L 15.2,5 c 0.9,1.1,1.5,2.5,1.5,4 s -0.6,2.9 -1.5,4 l 1.6,1.3 c 1.3 -1.4,2 -3.3,2 -5.3 S 18,5.1,16.8,3.7 z"/>'
        +'<path class="volume-level-3" d="M 20,1 l -1.6,1.3 c 1.6,1.8,2.5,4.1,2.5,6.7 s -1,4.9 -2.5,6.7 L 20,17 c 1.9 -2.2,3 -4.9,3 -8 C 23,5.9,21.9,3.2,20,1 z"/>'
    +'</g>'
+'</svg>';

var gap_name = 'vjs-slider-gap';
var slider_gaps = '<div class="'+gap_name+'-left"></div><div class="'+gap_name+'-right"></div>';

HolaSkin.prototype.set_play_button_state = function(btn_svg, state){
    if (this.play_state==state)
        return;
    this.play_state = state;
    var intv = this.intv;
    var _this = this;
    var steptotal = this.steptotal;
    var stagger = this.stagger;
    function mk_transition(from, to, steps){
        return (function(){
            var start = parseFloat(from);
            var delta = (parseFloat(to)-start)/parseFloat(steps);
            return (function(){ return start += delta; });
        }());
    }
    function mk_transform(from_path, to_path, steps){
        var path1pts = from_path.split(' ').slice(1, -1);
        var path2pts = to_path.split(' ').slice(1, -1);
        return (function(){
            var pathgen = path1pts.map(function(coord, index){
                return coord.split(',').map(function(fld, idx){
                    return mk_transition(fld,
                        path2pts[index].split(',')[idx], steps);
                });
            });
            return (function(){
                return pathgen.reduce(function(prev, curr){
                    return prev+' '+curr.reduce(function(prv, crr){
                        return prv()+','+crr();
                    });
                }, 'M')+' Z';
            });
        }());
    }
    var umorph = document.getElementById('umorph');
    var bars = btn_svg.getElementsByTagName('path');
    var stepcnt = 0, stepcnt1 = 0;
    if (intv)
        clearInterval(intv);
    if (state=='ended')
    {
        umorph.setAttribute('transform', 'translate(16.3, 16.5)');
        btn_svg.parentNode.setAttribute('transform', 'translate(16.3, 16.5)');
        bars[0].setAttribute('d', replay);
        bars[1].setAttribute('display', 'none');
        return;
    }
    bars[1].removeAttribute('display');
    var is_transformed = btn_svg.parentNode.getAttribute('transform');
    btn_svg.parentNode.removeAttribute('transform');
    umorph.removeAttribute('transform');
    // need to clear the attribute to avoid glitch with transition from
    // replay icon to animated pause icon
    if (is_transformed)
        bars[0].setAttribute('d', '');
    if (state=='paused')
    {
        var mk_path3 = mk_transform(play2, play1, steptotal);
        var mk_path4 = mk_transform(pause2, pause1, steptotal);
        this.intv = setInterval(function(){
            if (stepcnt < steptotal)
                bars[1].setAttribute('d', mk_path4());
            if (stepcnt >= stagger)
                bars[0].setAttribute('d', mk_path3());
            stepcnt++;
            if (stepcnt >= steptotal+stagger)
            {
                clearInterval(_this.intv);
                _this.intv = 0;
            }
        }, 20);
        return;
    }

    var mk_path1 = mk_transform(play1, play2, steptotal);
    var mk_path2 = mk_transform(pause1, pause2, steptotal);
    this.intv = setInterval(function(){
        if (stepcnt < steptotal)
            bars[0].setAttribute('d', mk_path1());
        if (stepcnt >= stagger)
            bars[1].setAttribute('d', mk_path2());
        stepcnt++;
        if (stepcnt >= steptotal+stagger)
        {
            clearInterval(_this.intv);
            _this.intv = 0;
        }
    }, 20);
};

HolaSkin.prototype.init = function(){
    var _this = this;
    var player = this.vjs;
    // play button special treatment: both buttons share a single shape
    // that's how it is morphed simultaneously
    if (!!this.opt.no_play_transform)
    {
        this.steptotal = 1;
        this.stagger = 0;
    }
    var play_button = player.controlBar.playToggle.el();
    play_button.insertAdjacentHTML('beforeend', morph_html);
    player.bigPlayButton.el().insertAdjacentHTML('beforeend', umorph_html);
    player.on('play', function(){
        _this.is_ended = false;
        _this.update_state(player);
    })
    .on('pause', function(){ _this.update_state(player); })
    .on('ended', function(){
        _this.is_ended = true;
        _this.update_state(player);
    })
    .on('seeking', function(){
        // hide replay button if it's not rewind to the start (cur time == 0)
        if (player.currentTime())
            _this.is_ended = false;
        _this.update_state(player);
    });
    this.update_state(player);
    var volume_slider = player.controlBar.volumeMenuButton.volumeBar.el();
    volume_slider.insertAdjacentHTML('beforeend', slider_gaps);
    var progress_holder = player.controlBar.progressControl.seekBar.el();
    progress_holder.insertAdjacentHTML('beforeend', slider_gaps);
};

HolaSkin.prototype.update_state = function(player){
    var play_button = player.controlBar.playToggle.el();
    var big_play_button = player.bigPlayButton.el();
    var replay_classname = 'vjs-play-control-replay';
    if (this.is_ended)
    {
        add_class_name(play_button, replay_classname);
        add_class_name(big_play_button, replay_classname);
    }
    else
    {
        remove_class_name(play_button, replay_classname);
        remove_class_name(big_play_button, replay_classname);
    }
    this.set_play_button_state(document.getElementById('morph'),
        this.is_ended ? 'ended' : player.paused() ? 'paused' : 'playing');
};

HolaSkin.prototype.dispose = function(){
    while (this.classes_added.length)
        remove_class_name(this.el, this.classes_added.pop());
};

// update some vjs controls

var MenuButton = vjs.getComponent('MenuButton');
var VolumeMenuButton = vjs.getComponent('VolumeMenuButton');
VolumeMenuButton.prototype.createEl = function(){
    var el = MenuButton.prototype.createEl.call(this);

    var icon = this.icon_ = document.createElement('div');
    icon.setAttribute('class', 'vjs-volume-icon');
    icon.innerHTML = volume_icon_svg;
    el.insertBefore(icon, el.firstChild);

    return el;
};

VolumeMenuButton.prototype.tooltipHandler = function(){
    return this.icon_;
};

var defaults = {
    className: 'vjs5-hola-skin',
    css: '/css/videojs-hola-skin.css',
    ver: 'ver=0.0.2-37'
};

// VideoJS plugin register

vjs.plugin('hola_skin', function(options){
    var opt = vjs.mergeOptions(defaults, options);
    if (opt.css && (!options.className || options.css))
        add_css(opt.css, opt.ver);
    new HolaSkin(this, opt);
});

}(window, window.videojs));