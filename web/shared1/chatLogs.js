const chatLogs = {
    "begin": {
        "id": "begin",
        "msg": "This is a Pockit. Would you like to take a tour?",
        "animation": "Standing Greeting",
        "response": [
            "tour",
            "free play",
        ]
    },
    "tour": {
        "id": "greetings",
        "from": "protagonist",
        "msg": "Hi! I'm milady. Welcome to my room. Let me show you around.",
        "response": [
            "greetings1",
            "greetings2",
        ]
    },
    "greetings1": {
        "id": "greetings1",
        "msg": "you have taken the drastic path",
        "map": "bedroom",
        "response": [
            "greetings3",
        ]
    },
    "greetings2": {
        "id": "greetings2",
        "msg": "you have chosen the path of least resistance",
        "map": "greenscreen",
        "response": [
            "greetings3",
        ]
    },
    "greetings3": {
        "id": "greetings2",
        "msg": "I got a new plant, wanna see it?",
        "response": [
            "greetings",
        ]
    },
    "tweet": {
        "id": "tweet",
        "msg": "i love you all.",
        "response": [
            "like",
            "retweet",
            "stop scrolling",
        ]
    },
    "news": {
        "id": "news",
        "msg": "Latest news here!",
        "response": [
            "news1",
            "news2",
            "news3",
        ]
    },
    "simple story": {
        "id": "simple story",
        "map": "stage",
        "animation": "Walking",
        "msg": "One day milady was walking down the street and she saw a cat.",
        "response": [
            "story1",
        ]
    },
    "story1": {
        "id": "story1",
        "animation": "Scared",
        "msg": "She tried to pet it but it ran away.",
        "response": [
            "story2",
        ]
    },
    "story2": {
        "id": "story2",
        "animation": "Thinking",
        "msg": "She was sad.",
        "response": [
            "story3",
        ]
    },
}

const stateMachineActions = {
    "standing greeting": [
        "map bedroom",
        "do milady1 Standing Greeting",
    ],
    "starttweeting": [
        "map bedroom",
        "walk protagonist 1,1",
    ],
    "startseance": [
        "map seance",
        "character pockit1 113",
        "character pockit2 114",
        "goto pockit1 1,1",
        "goto pockit1 2,1",
        "do pockit1 worship",
        "do pockit2 worship",
    ]
}

export {chatLogs}
