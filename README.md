# Draw Fast

**Draw Fast** is a demo that shows how you can use the [**tldraw library**](https://tldraw.dev) with realtime image generation. The demo has now finished and we’ve taken it down. But you can still run it on your own machine and try it out.

Here are two ways of doing that.

- [Run it locally](#run-it-locally)
- [Run it in CodeSandbox](#run-it-in-codesandbox)

# Run it locally

Here's a video tutorial. Or read below for a written guide.

https://github.com/tldraw/draw-fast/assets/15892272/dd175168-f4db-455a-9c70-2736cd4403d0

## 1. Clone the repo

Clone this repo!

```
git clone https://github.com/tldraw/draw-fast
```

## 2. Get a Fal key

Go to [fal.ai](https://fal.ai)

Login with github, and get a key from the [keys page](https://www.fal.ai/dashboard/keys). (You can give it any name you want).

![1](https://github.com/tldraw/draw-fast/assets/15892272/992a8a90-9d72-4a28-aebe-921c3f82e4e9)

Copy your key.

![2](https://github.com/tldraw/draw-fast/assets/15892272/740118d6-a9e2-4320-b2f7-abb63f416c9f)

## 3. Setup environment variables

Create a `.env` file in the root folder of your repo.
Paste your key there as `FAL_KEY`

Your file should something like this:

```
FAL_KEY=8bf6c68d-8711-426b-90c6-0d9636909fce:b774f2a649cfecbf56dce57db7966a73
```

## 4. Run it locally

In your terminal…

```
npm install
npm run dev
```

And open `localhost:3000`

## 5. Draw fast

Draw something in the rectangle!
Double-clicking the prompt to change it.
Click the small arrow to enter _lens mode_.

## 6. Share!

Record your screen and show us what you draw fast.

We’re [@tldraw on twitter](https://twitter.com/tldraw).

## Troubleshooting

If the generated images don’t appear, try running `npm install` and `npm run dev` again, or try waiting a while for your key to activate.

# Run it in CodeSandbox

## 1. Import the repo

Sign in on [CodeSandbox](https://codesandbox.io). Click on **Import repository**.

![a](https://github.com/tldraw/draw-fast/assets/15892272/dce56531-ca82-473d-b2ef-fe13644c7fb3)

Import the repo by pasting in `https://github.com/tldraw/draw-fast` and clicking **Import**.
![b](https://github.com/tldraw/draw-fast/assets/15892272/000597fe-69e0-43a0-96fb-89ab242c31f3)

## 2. Setup the environment

Click **Next** until you get to the **Set environment variables** screen.
![c](https://github.com/tldraw/draw-fast/assets/15892272/d321b780-c33c-4217-b647-f757182869f3)

On the **Set environment variables** screen, click **Add variable**.
![d](https://github.com/tldraw/draw-fast/assets/15892272/65699754-9a54-4406-a28b-285d94488997)

Name your key `FAL_KEY`.

You can get a key from [fal.ai](https://www.fal.ai/dashboard/keys)
Instructions on how to do that are [here](https://www.notion.so/Draw-Fast-help-038edf9a982847e19df078854c54c8dd?pvs=21).
![e](https://github.com/tldraw/draw-fast/assets/15892272/4c2a128c-a597-4578-87c4-44e73e29de86)

Click **Save**, then click **Next** until you get to the end of setup.

![f](https://github.com/tldraw/draw-fast/assets/15892272/9467f645-5843-445c-b346-68f2617c1d02)

Finally, click **Apply and restart**, and wait about 5 minutes.
![g](https://github.com/tldraw/draw-fast/assets/15892272/b9ba8c65-7b28-4e80-a760-6b1814244c7b)

## 3. Draw fast

Draw something in the rectangle!
Double-clicking the prompt to change it.
Click the small arrow to enter _lens mode_.

## 4. Share!

Record your screen and show us what you draw fast.

We’re [@tldraw on twitter](https://twitter.com/tldraw).
