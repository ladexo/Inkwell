// ============================================================
//  INKWELL — CONFIGURATION
// ============================================================
//
//  HOW TO ADD A NEW NOVEL:
//  1. Add a novel entry to the "novels" array below
//  2. Create a cover image at: images/NOVEL-ID/cover.webp
//  3. Create chapter files at: chapters/NOVEL-ID/ch1.html
//  4. Re-deploy
//
//  HOW TO ADD A CHAPTER:
//  1. Write your chapter as an HTML file (see sample)
//  2. Save it as: chapters/NOVEL-ID/ch#.html
//  3. Add artwork images in the same folder
//  4. Add a chapter entry below
//  5. Re-deploy
//
//  HOW TO ADD ILLUSTRATIONS IN CHAPTERS:
//  Just put <img> tags in your chapter HTML file:
//
//  Full-width artwork:
//    <figure class="illustration">
//      <img src="art1.webp" alt="Caption here">
//      <figcaption>Caption here</figcaption>
//    </figure>
//
//  Small centered artwork:
//    <figure class="illustration inline-sm">
//      <img src="art2.webp" alt="Caption">
//      <figcaption>Caption</figcaption>
//    </figure>
//
//  Artwork floating to the right of text:
//    <figure class="illustration float-right">
//      <img src="art3.webp" alt="Caption">
//    </figure>
//
//  Or just drop a plain <img> tag anywhere — the reader
//  auto-wraps it in a styled illustration block.
//
// ============================================================

const CONFIG = {

  author: "Ololade Suberu",
  siteName: "Inkwell",

  novels: [

    // ─── NOVEL 1: Children of Fate ─────────────────────────
    {
      id: "children-of-fate",
      title: "Children of Fate",
      type: "Light Novel",
      cover: "images/children-of-fate/cover.webp",
      description: "An epic saga following heroes bound by destiny, spanning worlds and generations. When fate chooses you, there is no escape — only the courage to answer. Illustrated with original artwork throughout.",
      genre: ["Fantasy", "Action", "Drama"],
      status: "ongoing",    // "ongoing" | "completed" | "hiatus"
      chapters: [
        {
          id: 1,
          title: "The Awakening",
          subtitle: "Chapter One",
          wordCount: 4200,
          status: "published",    // "published" | "coming-soon"
          date: "2026-04-22"
        },
        {
          id: 2,
          title: "Threads of Destiny",
          subtitle: "Chapter Two",
          wordCount: 5100,
          status: "published",
          date: "2026-05-06"
        },
        {
          id: 3,
          title: "The First Trial",
          subtitle: "Chapter Three",
          wordCount: 4800,
          status: "coming-soon",
          date: ""
        }
      ]
    }

    // ─── To add another novel, put a comma after the } above
    //     and paste a new block like this:
    //
    // ,{
    //   id: "your-novel-id",
    //   title: "Your Novel Title",
    //   type: "Light Novel",
    //   cover: "images/your-novel-id/cover.webp",
    //   description: "What it's about.",
    //   genre: ["Genre1", "Genre2"],
    //   status: "ongoing",
    //   chapters: [
    //     {
    //       id: 1,
    //       title: "First Chapter",
    //       subtitle: "Chapter One",
    //       wordCount: 3500,
    //       status: "published",
    //       date: "2026-04-23"
    //     }
    //   ]
    // }

  ]
};
