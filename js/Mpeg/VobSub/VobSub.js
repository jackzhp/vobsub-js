function VobSub(idxUrl, subUrl, videoID) {
	this.IDXUrl = idxUrl;
	this.SUBUrl = subUrl;
	this.IDX = null;
	this.SUB = null;
	this.Video = document.getElementById(videoID);
	// this.Video.width = 0;
	// this.Video.height = 0;
	this.subtitleOnly = true;
	this.idx = 0; //index for subtitle.
	this.next = null; //next subtitle
	this.autoClear = !this.subtitleOnly;//true for movie. but I just want to present subtitle, so false.
}

VobSub.prototype.Destruct = function () {
	this.IDX.Destruct();
	this.SUB.Destruct();

	delete this.IDX;
	delete this.SUB;
	delete this.Video;
}

VobSub.prototype.setTime = function (ts) {
	this.Video.currentTime = ts;
	this.idx = 0; //TODO: I should find the right idx.
}

//call this functionm will display next subtitle.
VobSub.prototype.display = function (idx) {
	var that = this;
	if (this.g) {
		this.g.Destruct();
	}
	var i;
	if (idx) {
		if (idx == "next") {
			i = that.idx + 1;
			if (i >= that.IDX.TimeTable.length) {
				i = that.IDX.TimeTable.length - 1;
			}
		} else if (idx == "previous") {
			i = that.idx - 1;
			if (i < 0)
				i = 0;
		} else {
			i = +idx;
		}
	} else {
		i = that.idx;
	}
	that.next = that.IDX.TimeTable[i];
	console.log("idx:" + i);
	that.DisplaySubtitle(that.next.Offset);
	that.idx = i;

	var e_canvas = document.getElementById("subtitle");
	Tesseract.recognize(e_canvas, 'jpn', {
		logger: m => console.log(m)
	}).then(({ data: { text } }) => { //text => {//
		console.log(text); //data
		var e_text = document.getElementById("subtitle_text");
		e_text.innerText = text;
	}).catch(e => {
		console.log("62", e);
	});

}


VobSub.prototype.Start = function () {
	var that = this;
	//The offset into the timetable

	this.Video.addEventListener("loadedmetadata", function () {
		that.SetVideoSize();
	});
	this.setTime(0); //80
	if (this.subtitleOnly) {
		this.display();
	} else {
		this.Video.addEventListener("timeupdate", function () {
			if (that.Video.currentTime >= that.next.Timestamp) {
				console.log("Subtitle Delay: " + (that.Video.currentTime - that.next.Timestamp)); //it should be 0.
				that.DisplaySubtitle(that.next.Offset);
				that.next = that.IDX.TimeTable[++that.idx];
			}
		});
	}
}

VobSub.prototype.SetVideoSize = function () {
	try {
		var scaleX = window.innerWidth / this.Video.videoWidth;
		var scaleY = window.innerHeight / this.Video.videoHeight;
		var scale = Math.min(scaleX, scaleY);
		console.log("scale", scale);

		this.Video.width = this.Video.videoWidth * scale;
		this.Video.height = this.Video.videoHeight * scale;
	} catch (e) {
		console.log("51", e);
	}
}

VobSub.prototype.DisplaySubtitle = function (offset) {
	this.SUB.Stream.Offset = offset;

	var spu = this.SUB.ReadSPU();
	if (!spu) {
		console.log("SPU Read Error");
		return false;
	}
	spu.Read();

	var g = spu.GetGraphics(this.IDX.Palette);
	g.Show();
	this.g = g;
	if (this.autoClear) {
		setTimeout(function () {
			g.Destruct();
		},
			g.Time);
	}
	spu.Destruct();
}

VobSub.prototype.Load = function (idxUrl, subUrl) {
	this.LoadIDX();
}

VobSub.prototype.LoadIDX = function () {
	var that = this;

	var loader = new TextLoader(this.IDXUrl);
	loader.OnError = function (error) {
		that.OnError(error);
	}

	loader.OnLoad = function (data) {
		that.IDX = new IDX();
		that.IDX.Parse(data);
		//The time and offset for the next subtitle
		that.next = that.IDX.TimeTable[that.idx];
		console.log("subtitle #" + that.idx, that.next);
		var idx = that.idx + 1;
		var o = that.IDX.TimeTable[idx];
		console.log("subtitle #" + idx, o); //{Timestamp: 26.126, Offset: 2048}
		idx = that.IDX.TimeTable.length - 1;
		o = that.IDX.TimeTable[idx];
		that.tsLast = o.Timestamp;
		console.log("last time stamp", that.tsLast);
		that.LoadSUB();
	}
	loader.Load();
}

VobSub.prototype.LoadSUB = function () {
	var that = this;

	var loader = new BinaryLoader(subUrl);
	loader.OnError = function (error) {
		that.OnError(error);
	}

	loader.OnLoad = function (data) {
		that.SUB = new MPEG2(data);
		that.OnReady();
	}

	loader.Load();
}

//Events
VobSub.prototype.OnReady = function () { };
VobSub.prototype.OnError = function (error) { };
