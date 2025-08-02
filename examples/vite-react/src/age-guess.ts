import {type Operation, resource} from 'effection'

export function guessAge(): Operation<{guess: number}> {
    console.log('started')
    return resource(function* (provide){
        console.log("doing the work")
        
        // do long running work here such as maintaining a websocket
        yield* provide({
            // function to interact with resource
            //  but just a simple function as an example
            get guess() {
                return Math.floor(Math.random() * 100)
            }
        })
    })
}
