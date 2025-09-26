const EggProduction = require('../models/EggProduction');
const EggStock = require('../models/EggStock');

// Record daily egg production
exports.recordEggProduction = async (req, res) => {
  try {
    const { date, quantity, type } = req.body;
    
    console.log('Creating production:', { date, quantity, type });
    
    if (!date || quantity == null) {
      return res.status(400).json({ message: 'Date and quantity are required' });
    }

    const eggType = type || 'Mixed';
    const prodQuantity = Number(quantity);

    // 1. Create production record
    const production = await EggProduction.create({ 
      date, 
      quantity: prodQuantity, 
      type: eggType 
    });

    // 2. Update or create stock
    let stock = await EggStock.findOne({ eggType });
    if (!stock) {
      stock = await EggStock.create({ 
        eggType, 
        currentStock: prodQuantity 
      });
    } else {
      stock.currentStock += prodQuantity;
      await stock.save();
    }

    console.log('Production created and stock updated:', { production, stock });

    res.status(201).json({
      message: 'Daily egg production recorded successfully',
      production,
      currentStock: stock.currentStock
    });
  } catch (error) {
    console.error('Create production error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all production records
exports.getAllProductions = async (req, res) => {
  try {
    const productions = await EggProduction.find().sort({ date: -1 });
    res.status(200).json(productions);
  } catch (error) {
    console.error('Get productions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get production by date
exports.getProductionByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const production = await EggProduction.findOne({ date: new Date(date) });
    if (!production) {
      return res.status(404).json({ message: 'No record found for this date' });
    }
    res.status(200).json(production);
  } catch (error) {
    console.error('Get by date error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a production record
exports.updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, quantity, type } = req.body;

    console.log('Updating production:', { id, date, quantity, type });

    // Find the existing production record
    const oldProduction = await EggProduction.findById(id);
    if (!oldProduction) {
      return res.status(404).json({ message: 'Record not found' });
    }

    console.log('Old production found:', oldProduction);

    const oldType = oldProduction.type || 'Mixed';
    const newType = type || 'Mixed';
    const oldQuantity = Number(oldProduction.quantity);
    const newQuantity = Number(quantity);

    // Update the production record
    const updatedProduction = await EggProduction.findByIdAndUpdate(
      id,
      { date, quantity: newQuantity, type: newType },
      { new: true }
    );

    // Handle stock updates
    if (oldType === newType) {
      // Same egg type - adjust by difference
      console.log('Same type, adjusting difference:', newQuantity - oldQuantity);
      
      let stock = await EggStock.findOne({ eggType: oldType });
      if (!stock) {
        // Create stock if it doesn't exist
        stock = await EggStock.create({ 
          eggType: oldType, 
          currentStock: Math.max(0, newQuantity) 
        });
      } else {
        stock.currentStock = stock.currentStock - oldQuantity + newQuantity;
        // Prevent negative stock
        if (stock.currentStock < 0) stock.currentStock = 0;
        await stock.save();
      }
      console.log('Stock after same-type update:', stock);
      
    } else {
      // Different egg types
      console.log('Different types - old:', oldType, 'new:', newType);
      
      // Subtract from old stock
      let oldStock = await EggStock.findOne({ eggType: oldType });
      if (oldStock) {
        oldStock.currentStock -= oldQuantity;
        if (oldStock.currentStock < 0) oldStock.currentStock = 0;
        await oldStock.save();
        console.log('Old stock after subtraction:', oldStock);
      }
      
      // Add to new stock
      let newStock = await EggStock.findOne({ eggType: newType });
      if (!newStock) {
        newStock = await EggStock.create({ 
          eggType: newType, 
          currentStock: newQuantity 
        });
      } else {
        newStock.currentStock += newQuantity;
        await newStock.save();
      }
      console.log('New stock after addition:', newStock);
    }

    res.status(200).json({
      message: 'Production updated successfully',
      production: updatedProduction
    });
    
  } catch (error) {
    console.error('Update production error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a production record
exports.deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting production:', id);

    // Find the production record first
    const production = await EggProduction.findById(id);
    if (!production) {
      return res.status(404).json({ message: 'Record not found' });
    }

    console.log('Production found for deletion:', production);

    const eggType = production.type || 'Mixed';
    const quantity = Number(production.quantity);

    // Subtract from stock before deleting
    let stock = await EggStock.findOne({ eggType });
    if (stock) {
      stock.currentStock -= quantity;
      // Prevent negative stock
      if (stock.currentStock < 0) stock.currentStock = 0;
      await stock.save();
      console.log('Stock after deletion adjustment:', stock);
    }

    // Delete the production record
    await EggProduction.findByIdAndDelete(id);
    console.log('Production deleted successfully');

    res.status(200).json({
      message: 'Production deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete production error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};




/*
const EggProduction = require('../models/EggProduction');
const EggStock = require('../models/EggStock');

// Record daily egg production
exports.recordEggProduction = async (req, res) => {
  try {
    const { date, quantity, type } = req.body;
    
    console.log('Creating production:', { date, quantity, type }); // Debug log
    
    if (!date || quantity == null) {
      return res.status(400).json({ message: 'Date and quantity are required' });
    }

    // 1. Create production record
    const production = await EggProduction.create({ 
      date, 
      quantity: Number(quantity), 
      type: type || 'Mixed' 
    });
    
    console.log('Production created:', production); // Debug log

    // 2. Update stock
    const eggType = type || 'Mixed';
    let stock = await EggStock.findOne({ eggType });
    
    if (!stock) {
      stock = await EggStock.create({ 
        currentStock: Number(quantity), 
        eggType 
      });
      console.log('New stock created:', stock); // Debug log
    } else {
      stock.currentStock += Number(quantity);
      await stock.save();
      console.log('Stock updated:', stock); // Debug log
    }

    res.status(201).json({
      message: 'Daily egg production recorded successfully',
      production,
      currentStock: stock.currentStock
    });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all production records
exports.getAllProductions = async (req, res) => {
  try {
    console.log('Fetching all productions...'); // Debug log
    const productions = await EggProduction.find().sort({ date: -1 });
    console.log(`Found ${productions.length} productions`); // Debug log
    res.status(200).json(productions);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get production by date
exports.getProductionByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const production = await EggProduction.findOne({ date: new Date(date) });
    if (!production) {
      return res.status(404).json({ message: 'No record found for this date' });
    }
    res.status(200).json(production);
  } catch (error) {
    console.error('Get by date error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a production record
exports.updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, quantity, type } = req.body;

    console.log('Updating production:', { id, date, quantity, type }); // Debug log

    // Find the existing production record
    const oldProduction = await EggProduction.findById(id);
    if (!oldProduction) {
      console.log('Production not found:', id); // Debug log
      return res.status(404).json({ message: 'Record not found' });
    }

    console.log('Old production found:', oldProduction); // Debug log

    // Update the production record
    const updatedProduction = await EggProduction.findByIdAndUpdate(
      id,
      { 
        date, 
        quantity: Number(quantity), 
        type: type || 'Mixed' 
      },
      { new: true }
    );

    console.log('Production updated:', updatedProduction); // Debug log

    // Handle stock adjustments
    const oldType = oldProduction.type || 'Mixed';
    const newType = type || 'Mixed';
    const oldQuantity = Number(oldProduction.quantity);
    const newQuantity = Number(quantity);

    if (oldType === newType) {
      // Same egg type - adjust quantity difference
      console.log('Same type, adjusting quantity difference'); // Debug log
      
      let stock = await EggStock.findOne({ eggType: oldType });
      if (!stock) {
        // Create stock record if it doesn't exist
        stock = await EggStock.create({ 
          eggType: oldType, 
          currentStock: newQuantity 
        });
      } else {
        const difference = newQuantity - oldQuantity;
        stock.currentStock += difference;
        // Prevent negative stock
        if (stock.currentStock < 0) stock.currentStock = 0;
        await stock.save();
      }
      console.log('Stock after same-type update:', stock); // Debug log
      
    } else {
      // Different egg types
      console.log('Different types, adjusting both stocks'); // Debug log
      
      // Subtract from old stock
      const oldStock = await EggStock.findOne({ eggType: oldType });
      if (oldStock) {
        oldStock.currentStock -= oldQuantity;
        if (oldStock.currentStock < 0) oldStock.currentStock = 0;
        await oldStock.save();
        console.log('Old stock after subtraction:', oldStock); // Debug log
      }
      
      // Add to new stock
      let newStock = await EggStock.findOne({ eggType: newType });
      if (!newStock) {
        newStock = await EggStock.create({ 
          eggType: newType, 
          currentStock: newQuantity 
        });
      } else {
        newStock.currentStock += newQuantity;
        await newStock.save();
      }
      console.log('New stock after addition:', newStock); // Debug log
    }

    res.status(200).json({
      message: 'Production updated successfully',
      production: updatedProduction
    });
    
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a production record
exports.deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Deleting production:', id); // Debug log

    // Find the production record first
    const production = await EggProduction.findById(id);
    if (!production) {
      console.log('Production not found for deletion:', id); // Debug log
      return res.status(404).json({ message: 'Record not found' });
    }

    console.log('Production found for deletion:', production); // Debug log

    // Adjust stock before deleting
    const eggType = production.type || 'Mixed';
    const stock = await EggStock.findOne({ eggType });
    
    if (stock) {
      stock.currentStock -= Number(production.quantity);
      // Prevent negative stock
      if (stock.currentStock < 0) stock.currentStock = 0;
      await stock.save();
      console.log('Stock after deletion adjustment:', stock); // Debug log
    }

    // Delete the production record
    await EggProduction.findByIdAndDelete(id);
    console.log('Production deleted successfully'); // Debug log

    res.status(200).json({
      message: 'Production deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
*/

/*
const EggProduction = require('../models/EggProduction');
const EggStock = require('../models/EggStock');

// Record daily egg production
exports.recordEggProduction = async (req, res) => {
  try {
    const { date, quantity, type } = req.body;
    if (!date || quantity == null) {
      return res.status(400).json({ message: 'Date and quantity are required' });
    }

    // 1. Create production record
    const production = await EggProduction.create({ date, quantity, type });

    // 2. Update stock
    let stock = await EggStock.findOne({ eggType: type });
    if (!stock) {
      stock = await EggStock.create({ currentStock: quantity, eggType: type });
    } else {
      stock.currentStock += quantity;
      await stock.save();
    }

    res.status(201).json({
      message: 'Daily egg production recorded successfully',
      production,
      currentStock: stock.currentStock
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all production records
exports.getAllProductions = async (req, res) => {
  try {
    const productions = await EggProduction.find().sort({ date: -1 });
    res.status(200).json(productions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get production by date
exports.getProductionByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const production = await EggProduction.findOne({ date: new Date(date) });
    if (!production) {
      return res.status(404).json({ message: 'No record found for this date' });
    }
    res.status(200).json(production);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a production record
exports.updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, quantity, type } = req.body;

    const oldProduction = await EggProduction.findById(id);
    if (!oldProduction) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Update the production record
    const updatedProduction = await EggProduction.findByIdAndUpdate(
      id,
      { date, quantity, type },
      { new: true }
    );

    // Adjust stock for both old and new egg types
    if (oldProduction.type && oldProduction.type === type) {
      // Same egg type - adjust quantity difference
      const stock = await EggStock.findOne({ eggType: type });
      if (stock) {
        const difference = quantity - oldProduction.quantity;
        stock.currentStock += difference;
        await stock.save();
      }
    } else {
      // Different egg types or old production had no type
      
      // Subtract old production from old stock
      if (oldProduction.type) {
        const oldStock = await EggStock.findOne({ eggType: oldProduction.type });
        if (oldStock) {
          oldStock.currentStock -= oldProduction.quantity;
          await oldStock.save();
        }
      }
      
      // Add new production to new stock
      if (type) {
        let newStock = await EggStock.findOne({ eggType: type });
        if (!newStock) {
          newStock = await EggStock.create({ currentStock: quantity, eggType: type });
        } else {
          newStock.currentStock += quantity;
          await newStock.save();
        }
      }
    }

    res.status(200).json({
      message: 'Production updated successfully',
      production: updatedProduction
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a production record
exports.deleteProduction = async (req, res) => {
  try {
    const { id } = req.params;

    const production = await EggProduction.findById(id);
    if (!production) {
      return res.status(404).json({ message: 'Record not found' });
    }

    // Remove from stock before deleting
    if (production.type) {
      const stock = await EggStock.findOne({ eggType: production.type });
      if (stock) {
        stock.currentStock -= production.quantity;
        // Prevent negative stock
        if (stock.currentStock < 0) {
          stock.currentStock = 0;
        }
        await stock.save();
      }
    }

    // Delete the production record
    await EggProduction.findByIdAndDelete(id);

    res.status(200).json({
      message: 'Production deleted successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
*/

/*
const EggProduction = require('../models/EggProduction');
const EggStock = require('../models/EggStock');

// Record daily egg production
exports.recordEggProduction = async (req, res) => {
  try {
    const { date, quantity, type } = req.body;
    if (!date || quantity == null) {
      return res.status(400).json({ message: 'Date and quantity are required' });
    }

    // 1. Create production record
    const production = await EggProduction.create({ date, quantity, type });

    // 2. Update stock
    let stock = await EggStock.findOne({ eggType: type});
    if (!stock) {
      stock = await EggStock.create({ currentStock: quantity, eggType: type });
    } else {
      stock.currentStock += quantity;
      stock.lastUpdated = new Date();
      await stock.save();
    }

    res.status(201).json({
      message: 'Daily egg production recorded successfully',
      production,
      currentStock: stock.currentStock
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all production records
exports.getAllProductions = async (req, res) => {
  try {
    const productions = await EggProduction.find().sort({ date: -1 });
    res.status(200).json(productions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get production by date
exports.getProductionByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const production = await EggProduction.findOne({ date: new Date(date) });
    if (!production) {
      return res.status(404).json({ message: 'No record found for this date' });
    }
    res.status(200).json(production);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a production record
exports.updateProduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, quantity, type } = req.body;

    const oldProduction = await EggProduction.findById(id);
    if (!oldProduction) return res.status(404).json({ message: 'Record not found' });

    const updatedProduction = await EggProduction.findByIdAndUpdate(
      id,
      { date, quantity, type},
      { new: true }
    );

    // Adjust stock
    const stock = await EggStock.findOne();
    if (stock) {
      stock.currentStock = stock.currentStock - oldProduction.quantity + quantity;
      stock.lastUpdated = new Date();
      await stock.save();
    }

    res.status(200).json({
      message: 'Production updated successfully',
      updatedProduction,
      currentStock: stock ? stock.currentStock : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a production record
exports.deleteProduction = async (req, res) => {
  try {
    const { id,  } = req.params;

    const production = await EggProduction.findByIdAndDelete(id);
    if (!production) return res.status(404).json({ message: 'Record not found' });

    // Adjust stock
    const stock = await EggStock.findOne();
    if (stock) {
      stock.currentStock -= production.quantity;
      stock.lastUpdated = new Date();
      await stock.save();
    }

    res.status(200).json({
      message: 'Production deleted successfully',
      currentStock: stock ? stock.currentStock : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
*/