// From https://stackoverflow.com/a/35576409/694640
/**
 * image pasting into canvas
 * 
 * @param {string} canvas_id - canvas id
 * @param {boolean} autoresize - if canvas will be resized
 */
export class Clipboard {

    private ctrl_pressed = false;
    private command_pressed = false;
    private pasteCatcher: any;
    private paste_event_support: boolean = false;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private autoresize: boolean;

    constructor(canvas_id: string, autoresize: boolean) {
        let _self: any = this;
        this.canvas = <HTMLCanvasElement>document.getElementById(canvas_id);
        this.ctx = this.canvas.getContext("2d")!;
        this.autoresize = autoresize;

        //handlers
        document.addEventListener('keydown', function (e) {
            _self.on_keyboard_action(e);
        }, false); //firefox fix
        document.addEventListener('keyup', function (e) {
            _self.on_keyboardup_action(e);
        }, false); //firefox fix
        document.addEventListener('paste', function (e) {
            _self.paste_auto(e);
        }, false); //official paste handler

        this.init();
    }


    //constructor - we ignore security checks here
    init() {
        this.pasteCatcher = document.createElement("div");
        this.pasteCatcher.setAttribute("id", "paste_ff");
        this.pasteCatcher.setAttribute("contenteditable", "");
        this.pasteCatcher.style.cssText = 'opacity:0;position:fixed;top:0px;left:0px;width:10px;margin-left:-20px;';
        document.body.appendChild(this.pasteCatcher);

        let _self = this;
        // create an observer instance
        var observer = new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                if (_self.paste_event_support === true || _self.ctrl_pressed == false || mutation.type != 'childList') {
                    //we already got data in paste_auto()
                    return true;
                }

                //if paste handle failed - capture pasted object manually
                if (mutation.addedNodes.length == 1) {
                    if ((<HTMLImageElement>mutation.addedNodes[0]).src != undefined) {
                        //image
                        _self.paste_createImage((<HTMLImageElement>mutation.addedNodes[0]).src);
                    }
                    //register cleanup after some time.
                    setTimeout(function () {
                        _self.pasteCatcher.innerHTML = '';
                    }, 20);
                }

                return false;
            });
        });
        var target = document.getElementById('paste_ff');
        var config = { attributes: true, childList: true, characterData: true };
        observer.observe(<any>target, config);
    }

    //default paste action
    private paste_auto(e: any) {
        this.paste_event_support = false;
        if (this.pasteCatcher != undefined) {
            this.pasteCatcher.innerHTML = '';
        }
        if (e.clipboardData) {
            var items = e.clipboardData.items;
            if (items) {
                this.paste_event_support = true;
                //access data directly
                for (var i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                        //image
                        var blob = items[i].getAsFile();
                        var URLObj = window.URL || (<any>window).webkitURL;
                        var source = URLObj.createObjectURL(blob);
                        this.paste_createImage(source);
                    }
                }
                e.preventDefault();
            }
            else {
                //wait for DOMSubtreeModified event
                //https://bugzilla.mozilla.org/show_bug.cgi?id=891247
            }
        }
    };
    //on keyboard press
    private on_keyboard_action(event: any) {
        let k = event.keyCode;
        //ctrl
        if (k == 17 || event.metaKey || event.ctrlKey) {
            if (this.ctrl_pressed == false)
                this.ctrl_pressed = true;
        }
        //v
        if (k == 86) {
            if (document.activeElement != undefined && (<any>document.activeElement).type == 'text') {
                //let user paste into some input
                return false;
            }

            if (this.ctrl_pressed == true && this.pasteCatcher != undefined) {
                this.pasteCatcher.focus();
            }
        }

        return false;
    };

    //on keyboard release
    private on_keyboardup_action(event: any) {
        //ctrl
        if (event.ctrlKey == false && this.ctrl_pressed == true) {
            this.ctrl_pressed = false;
        }
        //command
        else if (event.metaKey == false && this.command_pressed == true) {
            this.command_pressed = false;
            this.ctrl_pressed = false;
        }
    };
    //draw pasted image to canvas
    private paste_createImage(source: any) {
        var pastedImage = new Image();
        let self = this;
        pastedImage.onload = function () {
            if (self.autoresize == true) {
                //resize
                self.canvas.width = pastedImage.width;
                self.canvas.height = pastedImage.height;
            }
            else {
                //clear canvas
                self.ctx.clearRect(0, 0, self.canvas.width, self.canvas.height);
            }
            self.ctx.drawImage(pastedImage, 0, 0);
        };
        pastedImage.src = source;
    };
}