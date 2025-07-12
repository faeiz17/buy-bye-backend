// controllers/recipeController.js
const asyncHandler = require("express-async-handler");

// @desc    Generate recipe from cart items
// @route   POST /api/recipe/generate
// @access  Private (customer)
exports.generateRecipe = asyncHandler(async (req, res) => {
  // Try to initialize Groq inside the function
  let Groq, groq;
  try {
    Groq = require('groq-sdk');
    
    // Check if API key is available
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  } catch (error) {
    console.warn('Groq SDK not available:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Recipe generation service is not available. Please install groq-sdk: npm install groq-sdk',
      error: 'GROQ_SDK_NOT_INSTALLED'
    });
  }

  const { cartItems } = req.body;

  // Validate input
  if (!cartItems || !Array.isArray(cartItems)) {
    return res.status(400).json({
      success: false,
      message: 'Cart items are required and must be an array'
    });
  }

  // Filter items with food_recipe = 1
  const recipeItems = cartItems.filter(item => 
    item.vendorProduct?.product?.subCategory?.food_reciepe === 1 ||
    item.product?.food_recipe === 1 || 
    item.food_recipe === 1
  );

  // Check if we have at least 5 recipe items
  if (recipeItems.length < 5) {
    return res.status(400).json({
      success: false,
      message: `At least 5 items with food_recipe=1 are required. Found ${recipeItems.length}`
    });
  }

  // Extract ingredient names from cart items
  const ingredients = recipeItems.map(item => {
    const productName = item.vendorProduct?.product?.title || 
                       item.product?.title || 
                       item.product?.name || 
                       item.name || 
                       'Unknown item';
    const quantity = item.quantity || 1;
    return `${productName} (${quantity} ${item.product?.unit || 'piece'}${quantity > 1 ? 's' : ''})`;
  });

  // Create prompt for Groq API
  const prompt = `
You are a skilled Pakistani chef. I have the following ingredients from my grocery shopping:

${ingredients.join('\n')}

Please create a delicious Pakistani recipe using these ingredients. Follow these guidelines:
1. Prioritize traditional Pakistani dishes (biryani, karahi, curry, etc.)
2. Use as many of the provided ingredients as possible
3. Only suggest ingredients that make sense together
4. If some ingredients don't fit well together, suggest the best combination
5. Provide a complete recipe with:
   - Dish name
   - Ingredients list with quantities
   - Step-by-step cooking instructions
   - Cooking time
   - Serving size

Make the recipe authentic and delicious!
`;

  // Call Groq API
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful Pakistani chef assistant who creates authentic Pakistani recipes.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    model: 'llama3-8b-8192',
    temperature: 0.7,
    max_tokens: 1000,
    stream: false
  });

  const recipe = completion.choices[0]?.message?.content;

  if (!recipe) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate recipe'
    });
  }

  // Return the generated recipe
  res.json({
    success: true,
    data: {
      recipe: recipe,
      ingredients_used: ingredients,
      total_items: recipeItems.length
    }
  });
}); 
