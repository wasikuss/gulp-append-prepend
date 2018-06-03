const through = require('through2');
const PluginError = require('plugin-error');
const read = require('read-file');

const PLUGIN_NAME = 'gulp-append-prepend';

function filesGetContents(filepaths){
    if (!(filepaths instanceof Array)) {
        filepaths = [filepaths];
    }

    const filesContents = [];
    for(i = 0; i < filepaths.length; i++){
        filesContents.push(read.sync(filepaths[i], 'utf8'));
    }
    return filesContents;
}

function insert(texts, options, type) {
    if(!texts){
        throw new PluginError(PLUGIN_NAME, 'Missing text or path !');
    }

    if (!(texts instanceof Array)) {
        texts = [texts];
    }

    if (type != "append" && type != "prepend") {
        throw new PluginError(PLUGIN_NAME, 'Missing type !');
    }

    if (options == null) {
        options = {};
    }
    if (options.separator == null) {
        options.separator = '\n';
    }
    if (options.trim == null) {
        options.trim = true;
    }

    const buffers = [];
    for (i = 0; i < texts.length; i++) {
        var text = texts[i];
        if(options.trim) {
            text = text.trim()
        }
        if (type == "prepend") {
            buffers.push(new Buffer(text + options.separator));
        }else if(type == "append") {
            buffers.push(new Buffer(options.separator + text));
        }
    }

    const stream = through.obj(function(file, enc, cb) {
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams are not supported !'));
            return cb();
        }

        if (file.isBuffer()) {
            const concat = [];
            if (type == "append") {
                concat.push(file.contents);
            }
            for(i = 0; i < buffers.length; i++){
                concat.push(buffers[i]);
            }
            if (type == "prepend") {
                concat.push(file.contents);
            }

            file.contents = Buffer.concat(concat);
        }

        this.push(file);
        cb();
    });

    return stream;
}

module.exports.appendFile = function(filepath, options) {
    return insert(filesGetContents(filepath), options, "append");
};

module.exports.prependFile = function(filepath, options) {
    return insert(filesGetContents(filepath), options, "prepend");
};

module.exports.appendText = function(text, options) {
    return insert(text, options, "append");
};

module.exports.prependText = function(text, options) {
    return insert(text, options, "prepend");
};
