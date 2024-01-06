const stateMachineActions = {
    "standing greeting": [
        "map bedroom",
        "character protagonist anim Standing Greeting",
    ],
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
        "character protagonist walkto 1,3",
    ],
}

const chatLogs = [
    {
        "id": "begin",
        "msg": "This is a Pockit. Would you like to take a tour?",
        "animation": stateMachineActions["standing greeting"],
        "response": [
            "tour",
            "free play",
        ]
    },
    {
        "id": "tour",
        "from": "protagonist",
        "msg": "Hi! I'm milady. Welcome to my room. Let me show you around.",
        "animation": ["character protagonist anim Quick Formal Bow"],
        "response": [
            "greetings1",
            "greetings2",
        ]
    },
    {
        "id": "greetings1",
        "msg": "you have taken the drastic path",
        "animation": stateMachineActions["showRoom"],
        "response": [
            "greetings3",
        ]
    },
    {
        "id": "greetings2",
        "msg": "you have chosen the path of least resistance",
        "map": "greenscreen",
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
    {
        "id": "simple story",
        "map": "stage",
        "animation": ["character protagonist anim Walking"],
        "msg": "One day milady was walking down the street and she saw a cat.",
        "response": [
            "story1",
        ]
    },
    {
        "id": "story1",
        "animation": ["character protagonist anim Scared"],
        "msg": "She tried to pet it but it ran away.",
        "response": [
            "story2",
        ]
    },
    {
        "id": "story2",
        "animation": ["character protagonist anim Thinking"],
        "msg": "She was sad.",
        "response": [
            "story3",
        ]
    },
]

export {chatLogs}
