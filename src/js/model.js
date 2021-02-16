// import { map } from 'core-js/fn/array';
import { async } from 'regenerator-runtime';
import {
  API_URL,
  API_KEY,
  RES_PER_PAGE,
  SPOONACULAR_API_KEY,
  SPOONACULAR_API_URL,
} from './config.js';
import { AJAX, AJAX_spoonacular } from './helpers.js';

export const state = {
  recipe: {},
  search: {
    query: '',
    results: [],
    resultsPerPage: RES_PER_PAGE,
    page: 1,
  },
  bookmarks: [],
};

const createRecipeObject = function (data) {
  const { recipe } = data.data;

  return {
    id: recipe.id,
    title: recipe.title,
    publisher: recipe.publisher,
    sourceUrl: recipe.source_url,
    image: recipe.image_url,
    servings: recipe.servings,
    cookingTime: recipe.cooking_time,
    ingredients: recipe.ingredients,
    ...(recipe.key && { key: recipe.key }),
  };
};

// const createRecipeCalorieInfo = function () {
//   const calorieInfo = new Map();
// };

export const loadRecipe = async function (id) {
  try {
    const data = await AJAX(`${API_URL}/${id}?key=${API_KEY}`);
    const { ingredients } = data.data.recipe;
    console.log(ingredients);
    state.recipe = createRecipeObject(data);

    // const tempData = await AJAX_spoonacular(
    //   `${SPOONACULAR_API_URL}?ingredientList=${'large egg yolks'}&includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
    // );
    // console.log(tempData);
    // console.log(
    //   tempData[0]?.nutrition.nutrients.find(
    //     nutrient => nutrient.title === 'Calories'
    //   ).amount ?? 0
    // );

    // Spoonacular Calorie Info Implementation
    state.recipe.calorieInfo = new Map();
    state.recipe.totalCalories = 0;

    let totalCalories = 0;
    await Promise.all(
      ingredients.map(async ing => {
        const ingredientStr = `${ing.unit} ${ing.description}`;
        const ingData = await AJAX_spoonacular(
          `${SPOONACULAR_API_URL}?ingredientList=${ingredientStr}&includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
        );
        console.log(ingData);
        const ingCal = ing.quantity
          ? +ingData[0]?.nutrition?.nutrients.find(
              nutrient => nutrient.title === 'Calories'
            ).amount * ing.quantity ?? 0
          : +ingData[0]?.nutrition?.nutrients.find(
              nutrient => nutrient.title === 'Calories'
            ).amount ?? 0;
        state.recipe.calorieInfo.set(ing.description, ingCal);
        totalCalories += ingCal;
      })
    );

    // USING FOR OF LOOP
    // for (const ing of ingredients) {
    //   console.log(ing);
    //   const ingredientStr = `${ing.unit} ${ing.description}`;
    //   const ingData = await AJAX_spoonacular(
    //     `${SPOONACULAR_API_URL}?ingredientList=${ingredientStr}&includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
    //   );
    //   console.log(ingData);
    //   const ingCal = ing.quantity
    //     ? +ingData[0]?.nutrition?.nutrients.find(
    //         nutrient => nutrient.title === 'Calories'
    //       ).amount * ing.quantity ?? 0
    //     : +ingData[0]?.nutrition?.nutrients.find(
    //         nutrient => nutrient.title === 'Calories'
    //       ).amount ?? 0;
    //   state.recipe.calorieInfo.set(ing.description, ingCal);
    //   totalCalories += ingCal;
    // }

    state.recipe.totalCalories = totalCalories;

    // USING FOREACH
    // ingredients.forEach(async function (ing) {
    //   const ingredientStr = `${ing.unit} ${ing.description}`;
    //   const ingData = await AJAX_spoonacular(
    //     `${SPOONACULAR_API_URL}?ingredientList=${ingredientStr}&includeNutrition=true&apiKey=${SPOONACULAR_API_KEY}`
    //   );
    //   console.log(ingData);

    //   state.recipe.calorieInfo.set(
    //     ing.description,
    //     ing.quantity
    //       ? +ingData[0]?.nutrition?.nutrients.find(
    //           nutrient => nutrient.title === 'Calories'
    //         ).amount * ing.quantity ?? 0
    //       : +ingData[0]?.nutrition?.nutrients.find(
    //           nutrient => nutrient.title === 'Calories'
    //         ).amount ?? 0
    //   );

    //   state.recipe.totalCalories += ing.quantity
    //     ? +ingData[0]?.nutrition?.nutrients.find(
    //         nutrient => nutrient.title === 'Calories'
    //       ).amount * ing.quantity ?? 0
    //     : +ingData[0]?.nutrition?.nutrients.find(
    //         nutrient => nutrient.title === 'Calories'
    //       ).amount ?? 0;
    // });

    if (state.bookmarks.some(bookmark => bookmark.id === id))
      state.recipe.bookmarked = true;
    else state.recipe.bookmarked = false;

    // console.log(data.data.recipe);
    console.log(state.recipe);
  } catch (err) {
    // Temp error handling
    console.error(`${err} 💥💥💥💥`);
    throw err;
  }
};

export const loadSearchResults = async function (query) {
  try {
    state.search.query = query;

    const data = await AJAX(`${API_URL}?search=${query}&key=${API_KEY}`);

    // // NEW FEATURE: ADD CALORIE INFO
    // data.data.recipes.forEach(async function (rec) {
    //   // Get full recipe from Forkiy API
    //   const fullData = await AJAX(`${API_URL}/${rec.id}?${API_KEY}`);

    //   // Grab ingredients field
    //   const ingredients = fullData.data.recipe.ingredients.map(ing => ({
    //     quantity: +ing.quantity,
    //     description: ing.description,
    //   }));

    //   console.log(ingredients);
    //   // Loop over each ingredient and find calorie info from Spoonacular API
    //   const ingData = ingredients.map(async function (ing) {
    //     const ingSearchData = await AJAX(
    //       `${SPOONACULAR_API_URL}/search?query=${ing.description}&apiKey=${SPOONACULAR_API_KEY}`
    //     );
    //     console.log(ingSearchData);
    //   });
    // });

    state.search.results = data.data.recipes.map(rec => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
  } catch (err) {
    console.error(`${err} 💥💥💥💥`);
    throw err;
  }
};

export const getSearchResultsPage = function (page = state.search.page) {
  state.search.page = page;

  const start = (page - 1) * RES_PER_PAGE;
  const end = page * RES_PER_PAGE;

  return state.search.results.slice(start, end);
};

export const updateServings = function (newServings) {
  // Update ingredient and total calorie info
  let totalCalories = 0;
  for (let val of state.recipe.calorieInfo.values()) {
    val = (val / state.recipe.servings) * newServings;
    totalCalories += val;
  }
  state.recipe.totalCalories = totalCalories;

  // Update ingredients required for newServings
  state.recipe.ingredients.forEach(ing => {
    const ingCal = state.recipe.calorieInfo.get(ing.description);
    state.recipe.calorieInfo.set(
      ing.description,
      (ingCal / state.recipe.servings) * newServings
    );

    ing.quantity = (ing.quantity / state.recipe.servings) * newServings;
  });
  state.recipe.servings = newServings;

  console.log(state.recipe);
};

const persistBookmarks = function () {
  localStorage.setItem('bookmarks', JSON.stringify(state.bookmarks));
};

export const addBookmark = function (recipe) {
  // Add bookmark
  state.bookmarks.push(recipe);

  // Mark current recipe as bookmarked
  if (recipe.id === state.recipe.id) state.recipe.bookmarked = true;

  persistBookmarks();
};

export const deleteBookmark = function (id) {
  // Delete bookmark
  const index = state.bookmarks.findIndex(el => el.id === id);
  state.bookmarks.splice(index, 1);

  // Mark current recipe as NOT bookmarked
  state.recipe.bookmarked = false;

  persistBookmarks();
};

const init = function () {
  const storage = localStorage.getItem('bookmarks');
  if (storage) state.bookmarks = JSON.parse(storage);
};
init();

const clearBookmarks = function () {
  localStorage.clear('bookmarks');
};
// clearBookmarks();

export const uploadRecipe = async function (newRecipe) {
  try {
    const ingredients = Object.entries(newRecipe)
      .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
      .map(ing => {
        // const ingArr = ing[1].trim().split(',');
        const ingArr = ing[1]
          .trim()
          .split(',')
          .map(el => el.trim());
        // console.log(ingArr);
        if (ingArr.length !== 3)
          throw new Error(
            'Wrong ingredient format! Please use the correct format :]'
          );

        return {
          quantity: +ingArr[0] ?? null,
          unit: ingArr[1] ?? '',
          description: ingArr[2] ?? '',
        };
      });

    const recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };

    console.log(recipe);
    const data = await AJAX(`${API_URL}?key=${API_KEY}`, recipe);
    state.recipe = createRecipeObject(data);
    addBookmark(state.recipe);
  } catch (err) {
    throw err;
  }
};
