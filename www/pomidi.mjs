// https://github.com/tadfmac/poormidi
// CCby4.0 D.F.Mac.TripArts Music.
// 
// pomidi.js (Very Poor) Web MIDI API Wrapper
// For Google Chrome Only :D

// 2015.02.23 Change for P&P on Chrome Canary !!!! (W.I.P. and experimental now)
// 2015.06.07 P&P feature has now supported.
// 2015.08.08 add sendCtlChange()
// 2015.08.08 On sendNoteOn(), sendNoteOff() and sendCtlChange(), 
//            arguments are now able to set midi-channel,
//            and also these can be omitted.
//            See also comments in this code, for details.
// 2017.09.30 name change to `pomidi` is nowrenew to promise style.
// 2022.11.09 add device selection feature.
// 2023.09.22 ES6 export

class handler{
  constructor(){
    this.device = null;
    this.func = null;
    console.log("new handler()");
  }
  setDevice(device){
    console.log("handler.setDevice("+device+")");
    this.device = device;
  }
  handler(e){
    console.log("handler.hander() dev:"+this.device+" e:"+e);
    if(this.handler != null){
      this.func(e,this.device);
    }
  }
  setHandler(func){
    console.log("handler.setHandler()");
    this.func = func.bind(this);
  }
}

class pomidi{
  constructor() {
    this.midi = null;
    this.inputs = [];
    this.outputs = [];
    this.timer = null;
    this.onChangeEvent = null;
    this.onMidiEvent = null;
    this.devices = null;
  }
  init(options){
    return new Promise((resolve,reject)=>{
      navigator.requestMIDIAccess(options).then((access)=>{
        this.success(access);
        resolve(this); 
      },(err)=>{
        reject(err);
      });
    });    
  }
  _setHandleEvent(){
    console.log("poormidi._setHandleEvent()");
    if(this.onMidiEvent == null){
      return;
    }
    for(var cnt=0;cnt<this.inputs.length;cnt++){
      if(this.devices != null){
        for(let cnt2=0;cnt2<this.devices.length;cnt2++){
          if(this.devices[cnt2] == this.inputs[cnt].name){
            let hdr = new handler();
            hdr.setDevice(this.inputs[cnt].name);
            hdr.setHandler(this.onMidiEvent);
            this.inputs[cnt].hdr = hdr;
            this.inputs[cnt].onmidimessage = hdr.handler.bind(hdr);
          }
        }
      }else{
        this.inputs[cnt].onmidimessage = this.onMidiEvent;
        let hdr = new handler();
        hdr.setDevice(this.inputs[cnt].name);
        hdr.setHandler(this.onMidiEvent);
        this.inputs[cnt].hdr = hdr;
        this.inputs[cnt].onmidimessage = hdr.handler.bind(hdr);
      }
    }
  }
  setHandler(func, devices){
    console.log("poormidi.setHandler()======>");
    this.onMidiEvent = func;
    if(devices != undefined){
      this.devices = devices;
    }else{
      this.devices = null;
    }
    this._setHandleEvent();
    console.log("<============poormidi.setHandler()");
  }
  setOnChange(func){
    console.log("poormidi.setOnChange()");
    this.onChangeEvent = func;
  }
  sendNoteOn(){
    console.log("poormidi.sendNoteOn()");
    let note = 0;
    let velocity = 100;
    let channel = 0;
    let devices = null;
    let sendCnt = 0;
    if(arguments.length == 1){
      // midi.sendNoteOn(note);
      note = arguments[0];
    }else if(arguments.length == 2){
      // midi.sendNoteOn(note,velocity);
      note = arguments[0];
      velocity = arguments[1];
    }else if(arguments.length == 3){
      // midi.sendNoteOn(channel,note,velocity);
      channel = arguments[0] & 0x0f;
      note = arguments[1];
      velocity = arguments[2];
    }else if(arguments.length == 4){
      // midi.sendNoteOn(channel,note,velocity,devices);
      channel = arguments[0] & 0x0f;
      note = arguments[1];
      velocity = arguments[2];
      devices = arguments[3]; // array
    }else{
      console.log("poormidi.sendNoteOn:parameter error!!");
      return 0;
    }  
    if(this.outputs.length > 0){
      for(let cnt=0;cnt<this.outputs.length;cnt++){
        console.log("poormidi.sendNoteOn() output to :"+this.outputs[cnt].name);
        let send = false;
        if(devices == null){
          send = true;
        }else{
          for(let cnt2=0;cnt2<devices.length;cnt2++){
            if(devices[cnt2] == this.outputs[cnt].name){
              send = true;
              break;             
            }
          }
        }
        if(send){
          sendCnt ++;
          this.outputs[cnt].send([0x90|channel,note&0x7f,velocity&0x7f]);
        }
      }
    }
    return sendCnt;
  }
  sendNoteOff(){
    console.log("poormidi.sendNoteOff()");
    let note = 0;
    let channel = 0;
    let devices = null;
    let sendCnt = 0;
    if(arguments.length == 1){
      // midi.sendNoteOff(note);
      note = arguments[0];
    }else if(arguments.length == 2){
      // midi.sendNoteOff(channel,note);
      channel = arguments[0] & 0x0f;
      note = arguments[1];
    }else if(arguments.length == 3){
      // midi.sendNoteOff(channel,note,devices);
      channel = arguments[0] & 0x0f;
      note = arguments[1];
      devices = arguments[2]; // array
    }else{
      console.log("poormidi.sendNoteOff:parameter error!!");
      return 0;
    }  
    if(this.outputs.length > 0){
      for(let cnt=0;cnt<this.outputs.length;cnt++){
        console.log("poormidi.sendNoteOff() output to :"+this.outputs[cnt].name);
        let send = false;
        if(devices == null){
          send = true;
        }else{
          for(let cnt2=0;cnt2<devices.length;cnt2++){
            if(devices[cnt2] == this.outputs[cnt].name){
              send = true;
              break;             
            }
          }
        }
        if(send){
          sendCnt ++;
          this.outputs[cnt].send([0x80|channel,note,0]);
        }
      }
    }
    return sendCnt;
  }
  sendCtlChange(){
    console.log("poormidi.sendCtlChange()");
    let channel = 0;
    let number = 0;
    let value = 0;
    let devices = null;
    let sendCnt = 0;
    if(arguments.length == 2){
      // midi.sendCtlChange(number,value);
      number = arguments[0];
      value = arguments[1];
    }else if(arguments.length == 3){
      // midi.sendCtlChange(channel,number,value);
      channel = arguments[0] & 0x0f;
      number = arguments[1];
      value = arguments[2];
    }else if(arguments.length == 4){
      // midi.sendNoteOn(channel,number,value,devices);
      channel = arguments[0] & 0x0f;
      number = arguments[1];
      value = arguments[2];
      devices = arguments[3]; // array
    }else{
      console.log("poormidi.sendCtlChange:parameter error!!");
      return;
    }
    if(this.outputs.length > 0){
      for(let cnt=0;cnt<this.outputs.length;cnt++){
        let send = false;
        if(devices == null){
          send = true;
        }else{
          for(let cnt2=0;cnt2<devices.length;cnt2++){
            if(devices[cnt2] == this.outputs[cnt].name){
              send = true;
              break;             
            }
          }
        }
        if(send){
          sendCnt ++;
          console.log("poormidi.sendCtlChange() output to :"+this.outputs[cnt].name);
          this.outputs[cnt].send([0xB0|channel,number&0x7f,value&0x7f]);
        }
      }
    }
    return sendCnt;
  }
  sendNoteOnAt(){
    console.log("poormidi.sendNoteOn()");
    let note = 0;
    let velocity = 100;
    let channel = 0;
    let devices = null;
    let sendCnt = 0;
    let at = null;
    if(arguments.length == 2){
      // midi.sendNoteOn(note);
      at = arguments[0];
      note = arguments[1];
    }else if(arguments.length == 3){
      // midi.sendNoteOn(note,velocity);
      at = arguments[0];
      note = arguments[1];
      velocity = arguments[2];
    }else if(arguments.length == 4){
      // midi.sendNoteOn(channel,note,velocity);
      at = arguments[0];
      channel = arguments[1] & 0x0f;
      note = arguments[2];
      velocity = arguments[3];
    }else if(arguments.length == 5){
      // midi.sendNoteOn(channel,note,velocity,devices);
      at = arguments[0];
      channel = arguments[1] & 0x0f;
      note = arguments[2];
      velocity = arguments[3];
      devices = arguments[4]; // array
    }else{
      console.log("poormidi.sendNoteOnAt:parameter error!!");
      return 0;
    }  
    if(this.outputs.length > 0){
      for(let cnt=0;cnt<this.outputs.length;cnt++){
        console.log("poormidi.sendNoteOn() output to :"+this.outputs[cnt].name);
        let send = false;
        if(devices == null){
          send = true;
        }else{
          for(let cnt2=0;cnt2<devices.length;cnt2++){
            if(devices[cnt2] == this.outputs[cnt].name){
              send = true;
              break;             
            }
          }
        }
        if(send){
          sendCnt ++;
          this.outputs[cnt].send([0x90|channel,note&0x7f,velocity&0x7f],at);
        }
      }
    }
    return sendCnt;
  }

  onStateChange(){
    console.log("poormidi.onStateChange()");
    if(this.timer != null){
      clearTimeout(this.timer);
    }
    this.timer = setTimeout(()=>{
      this.refreshPorts();
      this.timer = null;
      if(this.onChangeEvent != null){
        console.log(">>>>>>>>>>> onChange expired")
        this.onChangeEvent();
      }
    },300);
  }
  refreshPorts(){
    console.log("poormidi.refreshPorts()");
    this.inputs = [];
    this.outputs = [];

    // inputs
    var it = this.midi.inputs.values();
    for(var o = it.next(); !o.done; o = it.next()){
      this.inputs.push(o.value);
      console.log("input port: name:"+o.value.name+", id:"+o.value.id+", oem:"+o.value.manufacturer+",type:"+o.value.type);
//        console.log("input port: "+o.value.name);
    }
    console.log("poormidi.refreshPorts() inputs: "+this.inputs.length);

/*
    for(var cnt=0;cnt<this.inputs.length;cnt++){
      this.inputs[cnt].onmidimessage = this.onMidiEvent;
    }
*/
    this._setHandleEvent();


    // outputs
    var ot = this.midi.outputs.values();
    for(var o = ot.next(); !o.done; o = ot.next()){
      this.outputs.push(o.value);
      console.log("output port: name:"+o.value.name+", id:"+o.value.id+", oem:"+o.value.manufacturer+",type:"+o.value.type);
    }
    console.log("poormidi.refreshPorts() outputs: "+this.outputs.length);
  }
  success(access){
    console.log("poormidi.success()");
    this.midi = access;
    this.refreshPorts();
    this.midi.onstatechange = ()=>{this.onStateChange()};
  }
  wait(ms){
    return new Promise((resolve)=>{setTimeout(resolve,ms);});
  }
}

export default pomidi;
