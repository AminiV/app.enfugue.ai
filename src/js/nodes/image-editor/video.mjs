/** @module nodes/image-editor/video.mjs */
import { isEmpty, promptFiles } from "../../base/helpers.mjs";
import { View } from "../../view/base.mjs";
import { VideoView } from "../../view/video.mjs";
import { ImageEditorNodeView } from "./base.mjs";
import { NoVideoView } from "./common.mjs";

/**
 * When pasting videos on the video editor, allow a few fit options
 */
class ImageEditorVideoNodeView extends ImageEditorNodeView {
    /**
     * @var bool Hide header (position absolutely)
     */
    static hideHeader = true;

    /**
     * @var string The name to show in the menu
     */
    static nodeTypeName = "Video";

    /**
     * @var array<string> All fit modes.
     */
    static allFitModes = ["actual", "stretch", "cover", "contain"];

    /**
     * @var array<string> All anchor modes.
     */
    static allAnchorModes = [
        "top-left", "top-center", "top-right",
        "center-left", "center-center", "center-right",
        "bottom-left", "bottom-center", "bottom-right"
    ];
    
    /**
     * @var string Add the classname for CSS
     */
    static className = 'image-editor-video-node-view';

    /**
     * @var object Buttons to control the scribble. Shortcuts are registered on the view itself.
     */
    static nodeButtons = {
        ...ImageEditorNodeView.nodeButtons,
        ...{
            "replace-video": {
                "icon": "fa-solid fa-upload",
                "tooltip": "Replace Video",
                "shortcut": "c",
                "callback": function() {
                    this.replaceVideo();
                }
            }
        }
    };

    /**
     * Updates the options after a user makes a change.
     */
    async updateOptions(newOptions) {
        // Reflected in DOM
        this.updateFit(newOptions.fit);
        this.updateAnchor(newOptions.anchor);
        this.updateOpacity(newOptions.opacity);
    };

    /**
     * Updates the video fit
     */
    async updateFit(newFit) {
        this.fit = newFit;
        this.content.fit = newFit;
        for (let fitMode of this.constructor.allFitModes) {
            this.content.removeClass(`fit-${fitMode}`);
        }
        if (!isEmpty(newFit)) {
            this.content.addClass(`fit-${newFit}`);
        }
    };

    /**
     * Updates the video anchor
     */
    async updateAnchor(newAnchor) {
        this.anchor = newAnchor;
        this.content.anchor = newAnchor;
        for (let anchorMode of this.constructor.allAnchorModes) {
            this.content.removeClass(`anchor-${anchorMode}`);
        }
        if (!isEmpty(newAnchor)) {
            this.content.addClass(`anchor-${newAnchor}`);
        }
    }

    /**
     * Updates the opacity
     */
    async updateOpacity(newOpacity) {
        this.opacity = newOpacity;
        (await this.content.getNode()).css("opacity", newOpacity);
    }

    /**
     * Prompts for a new video
     */
    async replaceVideo() {
        let videoToLoad;
        try {
            videoToLoad = await promptFiles("video/*");
        } catch(e) {
            // No files selected
        }
        if (!isEmpty(videoToLoad)) {
            let reader = new FileReader();
            reader.addEventListener("load", async () => {
                let videoView = new VideoView(this.config, reader.result);
                await this.setContent(videoView);
                this.updateFit(this.fit);
                this.updateAnchor(this.anchor);
                this.updateOpacity(this.opacity);
            });
            reader.readAsDataURL(videoToLoad);
        }
    }

    /**
     * Override getState to include the video, fit and anchor
     */
    getState(includeImages = true) {
        let state = super.getState(includeImages);
        state.src = includeImages ? this.content.src : null;
        state.anchor = this.anchor || null;
        state.fit = this.fit || null;
        state.opacity = this.opacity || 1.0;
        return state;
    }

    /**
     * Override setState to add the video and scribble
     */
    async setState(newState) {
        await super.setState(newState);
        if (isEmpty(newState.src)) {
            await this.setContent(new NoVideoView(this.config));
        } else {
            await this.setContent(new VideoView(this.config, newState.src));
        }
        await this.updateAnchor(newState.anchor);
        await this.updateFit(newState.fit);
        await this.updateOpacity(newState.opacity);
    }

    /**
     * Gets the size of the video when scaling the node
     */
    async getCanvasScaleSize() {
        if (isEmpty(this.content.src)) {
            return await super.getCanvasScaleSize();
        } else {
            await this.content.waitForLoad();
            return [
                Math.floor(this.content.width / 8) * 8,
                Math.floor(this.content.height / 8) * 8
            ];
        }
    }

    /**
     * Provide a default state for when we are initializing from an video
     */
    static getDefaultState() {
        return {
            "classname": this.name,
        };
    }
};

export { ImageEditorVideoNodeView };
