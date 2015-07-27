
# Challenge: Full-Stack

The assignment is to build a simple Producer/Consumer system. In this system 
the Generator will send a series of random arithmetic expressions, while the 
Evaluator will accept these expressions, compute the result and then report 
the solution to the Generator.


## Requirements

At a minimum, we would like to see the following implemented:

* The Producer and Consumer as separate NodeJS services.
* The Producer generating random addition expressions of two positive 
  integers, e.g. "2+3="
* The Consumer computing and returning the correct mathematical result for 
  the each expression it receives
* The Consumer successfully processing requests from two Producers 
  concurrently at a rate of at least 1 req/sec from each Producer 
  (2 req/sec in aggregate)
* The Consumer and Producer should log all messages they generate and receive.

You are free to support more than simple addition, but it is not required.

The end product should:

Be built in strict JavaScript and run with NodeJS

* NOT rely on any external services like Redis, ZeroMQ or similar technologies
* NOT use Express (Connect is Ok)
* Include UML Activity Diagram and UML Sequence Diagram documenting the business logic
* Include Unit tests


----


## Interesting Aspects of The Code

As much as I enjoyed writing all of the code, there were a few things that I really 
enjoyed and wanted to point out.

### Logging

I created a logging system that relied on a `.write()` interface. I was then able to 
create various implementations of the logging system, including a "multi-writer" that
logged to collections of writers at the same time. This allowed me to log values to the
file system and to the console simultaneously without having to hard-code `console.log()`
statements all over the place.

I am also recording expressions (generated and consumed) and performance metrics through
two different loggers. This way, the log files can rotate on a different basis since 
metrics-oriented logging will fill up more slowly.

### Application Error Roll-up

My application uses a custom Error object that allows for more information to be tracked.
Part of this structure allows an error to keep a handle on its `rootCause` error. This 
allows errors to "rolled-up", so to speak, as they travel back up the call-chain.

I also take care to make sure that the `.stack` property of the Error objects is recorded
in the logs. The `.stack` property does not appear to be copied during iteration, so it 
has to be copied explicitly.

### Performance

I was able to get **753 expressions processed per second** when I had 8 producers 
communicating with a single consumer. That was with a 10-ms delay between each producer
message. When I went above 8 producers, the performance started to drop significantly.
But, I am not sure if that was due to the processing of the expressions or the file I/O 
(the performance testing generated 30+MB worth of logs in the time it took me to spin 
up and observe the producers). I know that Node is non-blocking for I/O, but it maybe
have caused back-pressure somewhere?

### Flexibility

I tried to make the ExpressionGenerator and the ExpressionEvaluator very flexible. Each 
of them has features that can be turned on and off to produce different equations and 
accept different equations, respectively. For example, I can create a generator that only
does addition with integers:

```js
var generator = createExpressionGenerator()
	.withMin( 1 )
	.withMax( 100 )
	.withAddition()
	.withoutSubtraction()
	.withoutMultiplication()
	.withoutDivision()
	.withoutFloats()
;

console.log( generator.nextExpression() ); // "1+57="
```

... and, I can create an expression evaluator that allows divide-by-zero:

```js
var evaluator = createExpressionEvaluator()
	.withDivideByZero()
;

console.log( evaluator.evaluate( "5/0" ) ); // Infinity
```

### Exponential Back-off

If you have the produces and the consumer going, and then you kill the consumer, the 
producers will start to slow down using a `delay *= 1.2` simple back-off. I know this 
isn't all that robust; but, I wanted to show that I was trying to think about failure
cases.


----


## About Me

I have never written a single line of production Node.js. But, I do love JavaScript and
I am very excited for the opportunity to learn more about running JavaScript on the 
server. I hope that you can view this code, and my mindset, as a lump of raw clay that is
eager to be shaped by the excellence of your team.

## Technical Shortcomings

I don't know much of anything about UML (you'll notice the complete lack of UML diagrams
in the code). And, I know next to nothing about testing. I've written maybe 20 unit tests
_in my life_. Also, having never written production Node.js code before, I don't feel 
very confident in the architecture or organization of the code.

## Time to Complete

While I didn't track time on this project, I worked on it Friday morning and parts of the
day on Saturday and Sunday. If I had to guesstimate, I'd say I spent around 10-hours on
this project. So, not an insignificant amount of time, to be sure.

## Zero Dependencies

For this challenge, I wanted to create a dependency-free application. Meaning, there is
no `npm install`. All the required functionality is either part of the core Node.js 
offering; or, it's something that I had to explicitly build. While this doesn't 
necessarily lead to the most elegant solutions, I wanted to demonstrate that I am a 
problem solver that is not afraid to roll up my sleeves and get my hands dirty. This 
approach also forces me to think about how the underlying technology works rather than 
relying on community-driven abstractions.

### I Would Rather Use Promises

Since I was trying to keep this dependency-free, I used callbacks to handle asynchronous 
code. If I were to do this with dependencies, I would have done `npm install q` and used
Kris Kowal's promise library. I know other people love BlueBird; but, coming from an 
AngularJS background, q just makes sense.
