const resizeImageData = require('resize-image-data');

const {
    MessagePort, parentPort
} = require('worker_threads');

parentPort.once('message', (value) => {
    var opts = value.opts;
    if (value.port instanceof MessagePort) {
        value.port.on('message', (rgbaFrame) => {

            if (rgbaFrame.width != opts.width || opts.height != rgbaFrame.height) { //Scale the image if its not outputsize
                rgbaFrame = resizeImageData(rgbaFrame, opts.width, opts.height, 'biliniear-interpolation')
            }

            value.port.postMessage(new Buffer(rgbaFrame.data));
        });
    }
});
