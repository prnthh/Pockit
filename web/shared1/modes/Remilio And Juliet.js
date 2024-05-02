import { chatLogs, initiateChatNode } from "../main.js";

export default function AdventureMode(Character, currentVrms, cameraLookAtCharacter) {
    async function runLoadTest()
    {
        // random 1-500
        chatLogs.push({
            "id": "remilio and juliet",
            "from": "remilio",
            "animation": ["map Bedroom", "load remilio 149.vrm", "character remilio position 0,-2", "character remilio anim Happy", "character protagonist rotation 3", "camera remilio"],
            "msg": "hi! my name is remilibro",
            "response": [
                "rj_0",
            ]
        },{
            "id": "rj_0",
            "from": "protagonist",
            "animation": [ "character remilio anim Thinking", 'camera protagonist'],
            "msg": "hi remilibro, my name is juliet",
            "response": [
                "rj_1"
            ]
        },{
            "id": "rj_1",
            "from": "remilio",
            "animation": [ "character remilio anim Thinking", 'camera remilio'],
            "msg": "superb",
            "response": [
                "rj_2"
            ]
        },{
            "id": "rj_2",
            "from": "protagonist",
            "animation": [ "character bob anim Thinking", "camera protagonist"],
            "msg": "u stinky",
            "response": [
                "rj_2"
            ]
        },
        );
        initiateChatNode("remilio and juliet");
    }
    
    runLoadTest();
}