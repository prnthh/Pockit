import { chatLogs, initiateChatNode } from "../main.js";

export default function AdventureMode(Character, currentVrms, cameraLookAtCharacter) {
    async function runLoadTest()
    {
        // random 1-500
        chatLogs.push(
            {
                "id": "cracked old man",
                "from": "bob",
                "animation": ["map lumbridge", "load bob 149.vrm", "character bob position 0,-5", "character protagonist prop rune_scimitar", "character protagonist walkto 0,-3", "camera bob", "character bob anim Happy"],
                "msg": "wanna do some crack?",
                "response": [
                    "cracked-yeah",
                    "cracked-nah",
                ]
            },
            {
                "id": "cracked-yeah",
                "from": "protagonist",
                "animation": ["character protagonist anim Quick Formal Bow", "camera protagonist"],
                "msg": "yeah sure",
                "response": [
                    "cracked-yeah2",
                ]
            },
            {
                "id": "cracked-nah",
                "from": "protagonist",
                "animation": ["character protagonist anim Shaking Head No", "camera protagonist"],
                "msg": "nah, I'm good",
                "response": [
                    "cracked-yeah2",
                ]
            },
            {
                "id": "cracked-yeah2",
                "from": "bob",
                "animation": ["character bob anim Pointing", "camera bob", "load junkie 1.vrm", "character junkie position -13,-13", "character junkie prop pistol", "character junkie walkto -13,-14"],
                "msg": "great, go get it from the junkies behind the castle",
                "response": [
                    "cracked-yeah3",
                ]
            },
            {
                "id": "cracked-yeah3",
                "animation": ["character protagonist walkto -3,-16", "camera protagonist", "sleep 8000", "character protagonist walkto -13,-17", "sleep 1000", "camera protagonist"],
                "msg": "you walk to the junkies behind the castle",
                "response": [
                    "cracked-yeah4",
                ]
            },
            {
                "id": "cracked-yeah4",
                "from": "junkie",
                "animation": ["character junkie anim Pointing", "camera junkie",],
                "msg": "wanna see my warez?",
                "response": [
                    "cracked-yeah5",
                ]
            },
            {
                "id": "cracked-yeah5",
                "from": "protagonist",
                "animation": ["character protagonist anim Thinking", "camera protagonist",],
                "msg": "what kind of warez?",
                "response": [
                    "cracked-yeah6",
                ]
            },
            {
                "id": "cracked-yeah6",
                "from": "junkie",
                "animation": ["character junkie anim Pointing", "camera junkie",],
                "msg": "im a dealer of rare milady jpegs",
                "response": [
                    "cracked-yeah7",
                ]
            },
            {
                "id": "cracked-yeah7",
                "from": "protagonist",
                "animation": ["character protagonist anim Pointing", "camera protagonist",],
                "msg": "wow the cracked old man was really wise",
                "response": [
                    "begin",
                ]
            },);
        initiateChatNode("cracked old man");
    }
    
    runLoadTest();
}