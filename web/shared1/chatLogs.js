const stateMachineActions = {
    "startseance": [
        "map seance",
        "character pockit1 113",
        "character pockit2 114",
        "goto pockit1 1,1",
        "goto pockit1 2,1",
        "do pockit1 worship",
        "do pockit2 worship",
    ],
    "showRoom": [
        "map bedroom",
        "character protagonist walkto -1,3",
    ],
}

const chatLogs = [
    {
        "id": "begin",
        "msg": "This is a Pockit. Would you like to take a tour?",
        "animation": ["map chairs/1",  "character protagonist position 0,0", "character protagonist anim Standing Greeting", "character protagonist rotation 0", "camera protagonist", ],
        "response": [
            "cracked old man",
            "free play",
        ]
    },
    {
        "id": "tour",
        "from": "protagonist",
        "msg": "Hi! I'm milady. Welcome to my room. Let me show you around.",
        "animation": ["character protagonist anim Quick Formal Bow", "map bedroom"],
        "response": [
            "greetings1",
            "greetings2",
        ]
    },
    {
        "id": "greetings1",
        "msg": "This is my computer. I use it to do my homework.",
        "animation": stateMachineActions["showRoom"],
        "response": [
            "greetings3",
        ]
    },
    {
        "id": "greetings2",
        "msg": "you have chosen the path of least resistance",
        "animation": ["map greenscreen"],
        "response": [
            "greetings3",
        ]
    },
    {
        "id": "greetings3",
        "msg": "I got a new plant, wanna see it?",
        "from": "protagonist",
        "response": [
            "greetings",
        ]
    },
    {
        "id": "news",
        "msg": "Latest news here!",
        "response": [
            "news1",
            "news2",
            "news3",
        ]
    },
]

export {chatLogs}
