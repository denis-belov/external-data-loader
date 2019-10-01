/*
eslint-disable
linebreak-style,
no-magic-numbers
*/

module.exports = class {
  constructor() {
    // this.content = {};
    this.length = null;
    this.current = null;
    this.loaded = null;
    this.progress = null;
    this.rejectOnError = false;
  }

  getXhr({
    name,
    type,
    source,
    middleware,
  }, resolve, reject) {
    const xhr = new XMLHttpRequest();
    xhr.lastLoaded = 0;
    xhr.image = null;
    xhr.lengthComputable = true;
    xhr.loaded = 0;

    if (source.constructor === ArrayBuffer) {
      xhr.image = new Image();
      xhr.image.onload = () => this.onload(xhr, name, middleware, resolve);
      xhr.image.src = window.URL.createObjectURL(new Blob([ source ]));
    } else {
      xhr.open('GET', source, true);

      if (type === 'image') {
        xhr.responseType = 'arraybuffer';
        xhr.image = new Image();
      } else if (type === 'document') {
        xhr.responseType = type;
        xhr.overrideMimeType('text/xml');
      } else {
        xhr.responseType = type;
      }

      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
      xhr.setRequestHeader('Content-type', 'text');

      xhr.onprogress = (evt) => this.onprogress(xhr, evt);

      xhr.onload = () => {
        if (xhr.status === 200) {
          if (type === 'image') {
            xhr.image.onload = () => this.onload(xhr, name, middleware, resolve);
            xhr.image.src = window.URL.createObjectURL(new Blob([ xhr.response ]));
          } else {
            this.onload(xhr, name, middleware, resolve);
          }
        } else if (this.rejectOnError) {
          reject(xhr);
        } else {
          this.onloadBroken(name, resolve);
        }
      };

      xhr.onerror = (response) => reject(response);

      xhr.send();
    }

    return xhr;
  }

  load(options) {
    return new Promise((resolve, reject) => {
      if (!options || !options.sources) {
        reject(new Error('external-data-loader ERROR: NO SOURCES'));
      } else {
        this.length = Object.keys(options.sources).length;
        this.current = 0;
        this.loaded = 0;
        this.progress = options.progress || (() => 0);
        this.rejectOnError = false;

        for (const source in options.sources) {
          const src = options.sources[source];
          this.getXhr({
            name: source,
            type: src.type || 'text',
            source: src.source || src,
            middleware: src.middleware || null,
          }, resolve, reject);
        }
      }
    });
  }

  onprogress(xhr, evt) {
    xhr.lengthComputable = evt.lengthComputable;

    if (xhr.lengthComputable) {
      this.loaded += (evt.loaded / evt.total) - xhr.lastLoaded;
      xhr.lastLoaded = evt.loaded / evt.total;
      xhr.loaded = xhr.lastLoaded;
      this.progress();
    }
  }

  onload(xhr, name, middleware, resolve) {
    this.loaded += xhr.lengthComputable ? (1 - xhr.loaded) : 1;
    this.progress();
    const src = this.content[name];
    const content = src.image || src.response || src.responseText;
    this.content[name] = middleware ? middleware(content) : content;

    if (++this.current === this.length) {
      this.loaded = this.length;
      this.progress();
      resolve(this.content);
    }
  }

  onloadBroken(name, resolve) {
    this.loaded++;
    this.progress();

    if (++this.current === this.length) {
      this.loaded = this.length;
      this.progress();
      resolve(null);
    }
  }
};
