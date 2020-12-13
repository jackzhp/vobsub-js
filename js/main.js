/**
 * Notes
 * the url to the idx and sub file should be specified trough a track element the browser wont be able to handle it but we will
 *
 */
var idxUrl = "http://192.168.254.171:8080/QC10.idx";
var subUrl = "http://192.168.254.171:8080/QC10.sub";

window.onload = function () {
	main();
}

function main() {
	vobsub = new VobSub(idxUrl, subUrl, "video");
	vobsub.OnError = function (error) { console.log(error); }
	vobsub.OnReady = function () {
		console.log("ready");
		vobsub.Start();
	}
	vobsub.Load();
}

