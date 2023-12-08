const chatLogs = {
    "begin": {
        "msg": "...",
        "response": [
            {msg: "begin chat", action: "addPoint", nextMsg: "greetings"},
        ]
    },
    "greetings": {
        "msg": "hi.. u look weird. are you even a girl?",
        "response": [
            {msg: "yea", action: "addPoint", nextMsg: "greetings1"},
            {msg: "no im a boy", action: "addPoint", nextMsg: "greetings2"},
        ]
    },
    "greetings1": {
        "msg": "ohh cool, nice to meet you",
        "response": [
            { action: "addPoint", nextMsg: "greetings"},
        ]
    },
    "greetings2": {
        "msg": "oh thats okay. nice to meet you",
        "response": [
            { action: "addPoint", nextMsg: "greetings"},
        ]
    }
}

const news = [
    `Latest news here!
    v0.1 is out. im so happy. 
    i love you all.
    
    introducing chat mode.
    chat with milady to unlock poses.`,
]

export {chatLogs, news}
