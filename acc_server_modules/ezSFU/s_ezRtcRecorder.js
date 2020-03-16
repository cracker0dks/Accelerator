//@ts-check

/* ----------------------
WebRTC MediaStream Recorder!
Using ffmpeg to encode frames of Video and Audio to mp4!
Not very performant because we use RTCVideoSink with OnFrame!
NOTE: We are recording only the first Video and audio track!
------------------------*/

var fs = require('fs');
const { RTCVideoSink, RTCAudioSink, i420ToRgba } = require('wrtc').nonstandard;
const Readable = require('stream').Readable;
const ffmpeg = require('fluent-ffmpeg')
const { Worker, MessageChannel } = require('worker_threads');

function record(stream, opts, callback) {
    var recoding = true;
    var videoRecordingRunning = false;
    var AudioRecordingRunning = false;

    this.stop = function () {
        //console.log("REC STOP CALLED!")
        recoding = false;
    }

    if (stream.getVideoTracks().length > 0) { //Video Recorder
        videoRecordingRunning = true;
        var vidRStream = new Readable();
        vidRStream._read = function () {
            return recoding;
        };

        var track = stream.getVideoTracks()[0];
        const sink = new RTCVideoSink(track)

        const videoworker = new Worker('./s_ezRtcRecordWorker.js');
        const videoworkerChannel = new MessageChannel();

        videoworker.postMessage({ port: videoworkerChannel.port1, opts: opts }, [videoworkerChannel.port1]);
        videoworkerChannel.port2.on('message', (value) => {
            if (recoding)
                vidRStream.push(value); //Push the scaled data from the worker into the stream
        });

        videoworker.on('exit', (code) => {
            if (code !== 0)
                console.log(new Error(`VideoWorker stopped with exit code ${code}`));
        })

        sink.onframe = ({ frame }) => {
            if (!recoding) {
                sink.stop();
                vidRStream.push(null);
                return false;
            }

            var rgbaFrame = { //Create plank frame
                width: frame.width,
                height: frame.height,
                data: new Uint8ClampedArray(frame.width * frame.height * 4)
            }
            i420ToRgba(frame, rgbaFrame); //Change img from YUV to RGBA

            videoworkerChannel.port2.postMessage(rgbaFrame); //Send to worker for scaleing (Use worker so we are not using the main thread)
        }

        var videoff = ffmpeg();
        videoff.input(vidRStream) //RECORD VIDEO
            .inputOptions('-use_wallclock_as_timestamps 1') //Ensure the correct framerate as it is variable in webrtc
            .inputFormat('rawvideo')
            .inputOptions('-s ' + opts.width + 'x' + opts.height)
            .inputOptions('-pix_fmt rgba') //rgb24 //yuv420p //rgba
            .format('mp4')
            .noAudio()
            .videoCodec('libx264') //libx264
            .fpsOutput(29.7)
            .output("v" + opts.recordName)
            // .on('AudiocodecData', data => {
            //     console.log('CODEC DATA:');
            //     console.log(data);
            // })
            // .on('progress', progress => {
            //     console.log('PROGRESS:');
            //     console.log(progress);
            // })
            // .on('stderr', stderr => {
            //     console.log(stderr);
            // })
            .on('error', err => {
                console.log('Error rendering: %s', err.message);
            })
            .on('end', () => {
                //console.log('video saved!');
                videoRecordingRunning = false;
                recordingDone();
            })
            .run();
    }

    if (stream.getAudioTracks().length > 0) { //Record audio
        AudioRecordingRunning = true;
        var audioRStream = new Readable();
        audioRStream._read = function () {
            return recoding;
        };

        var track = stream.getAudioTracks()[0];
        const sink = new RTCAudioSink(track)
        sink.ondata = (event) => {
            if (!recoding) {
                sink.stop();
                audioRStream.push(null);
                return false;
            }
            audioRStream.push(Buffer.from(event.samples.buffer))
        }

        var audioff = ffmpeg();
        audioff.addInput(audioRStream) //RECORD AUDIO
            .inputOptions('-f s16le') //Set codec
            .inputOptions('-ac 1') //Set audiochannel
            .inputOptions('-ar 48k') //Set bitrate
            .format('mp4')
            .noVideo()
            .output("a" + opts.recordName)
            // .on('AudiocodecData', data => {
            //     console.log('CODEC DATA:');
            //     console.log(data);
            // })
            // .on('progress', progress => {
            //     console.log('PROGRESS:');
            //     console.log(progress);
            // })
            // .on('stderr', stderr => {
            //     console.log(stderr);
            // })
            .on('error', err => {
                console.log('Error rendering: %s', err.message);
            })
            .on('end', () => {
                //console.log('audio saved!');
                AudioRecordingRunning = false;
                recordingDone()
            })
            .run();
    }

    function recordingDone() {
        if (!AudioRecordingRunning && !videoRecordingRunning) {
            if (stream.getAudioTracks().length > 0 && stream.getVideoTracks().length > 0) { //We recorded both.. so merge it
                var mergeff = ffmpeg();
                mergeff.addInput("v" + opts.recordName)
                    .addInput("a" + opts.recordName)
                    .addOption('-c copy')
                    .on('stderr', stderr => {
                        console.log(stderr);
                    })
                    .on('error', err => {
                        console.log('Error rendering: %s', err.message);
                    })
                    .on('end', () => {
                        fs.unlink("v" + opts.recordName, (err) => {
                            if (err) throw err;
                        });
                        fs.unlink("a" + opts.recordName, (err) => {
                            if (err) throw err;
                        });
                        callback();
                        //console.log('merge saved!');
                    })
                    .output(opts.recordPath+''+opts.recordName)
                    .run()
            } else if (stream.getVideoTracks().length > 0) { //Only video was recorded
                fs.rename("v" + opts.recordName, opts.recordPath+''+opts.recordName, function (err) {
                    if (err) console.log('error renaming file: ' + err);
                });
                callback();
            } else if (stream.getAudioTracks().length > 0) { // Only audio was recorded
                fs.rename("a" + opts.recordName, opts.recordPath+''+opts.recordName, function (err) {
                    if (err) console.log('error renaming file: ' + err);
                });
                callback();
            }
        }
    }
}

module.exports = {
    record: record
}