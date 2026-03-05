import { useState } from 'react'
import './App.css'

interface Expense {
  id: string
  description: string
  amount: number
  date: string
}

interface BudgetCategory {
  id: string
  name: string
  budgetAmount: number
  expenses: Expense[]
}

function App() {
  const [categories, setCategories] = useState<BudgetCategory[]>([
    {
      id: '1',
      name: 'Food & Dining',
      budgetAmount: 500,
      expenses: [
        { id: 'e1', description: 'Groceries', amount: 120, date: '2026-03-01' },
        { id: 'e2', description: 'Restaurant', amount: 45, date: '2026-03-02' }
      ]
    },
    {
      id: '2',
      name: 'Transportation',
      budgetAmount: 300,
      expenses: [
        { id: 'e3', description: 'Gas', amount: 60, date: '2026-03-01' }
      ]
    }
  ])

  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryBudget, setNewCategoryBudget] = useState('')
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null)
  const [newExpenseDesc, setNewExpenseDesc] = useState('')
  const [newExpenseAmount, setNewExpenseAmount] = useState('')

  const addCategory = () => {
    if (!newCategoryName.trim() || !newCategoryBudget) return
    
    const newCategory: BudgetCategory = {
      id: Date.now().toString(),
      name: newCategoryName,
      budgetAmount: parseFloat(newCategoryBudget),
      expenses: []
    }
    
    setCategories([...categories, newCategory])
    setNewCategoryName('')
    setNewCategoryBudget('')
  }

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(cat => cat.id !== id))
  }

  const addExpense = (categoryId: string) => {
    if (!newExpenseDesc.trim() || !newExpenseAmount) return
    
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          expenses: [
            ...cat.expenses,
            {
              id: Date.now().toString(),
              description: newExpenseDesc,
              amount: parseFloat(newExpenseAmount),
              date: new Date().toISOString().split('T')[0]
            }
          ]
        }
      }
      return cat
    }))
    
    setNewExpenseDesc('')
    setNewExpenseAmount('')
  }

  const deleteExpense = (categoryId: string, expenseId: string) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          expenses: cat.expenses.filter(exp => exp.id !== expenseId)
        }
      }
      return cat
    }))
  }

  const getCategoryTotal = (category: BudgetCategory) => {
    return category.expenses.reduce((sum, exp) => sum + exp.amount, 0)
  }

  const getRemaining = (category: BudgetCategory) => {
    return category.budgetAmount - getCategoryTotal(category)
  }

  const getTotalBudget = () => {
    return categories.reduce((sum, cat) => sum + cat.budgetAmount, 0)
  }

  const getTotalSpent = () => {
    return categories.reduce((sum, cat) => sum + getCategoryTotal(cat), 0)
  }

  const getTotalRemaining = () => {
    return getTotalBudget() - getTotalSpent()
  }

  const getPercentageSpent = (category: BudgetCategory) => {
    return (getCategoryTotal(category) / category.budgetAmount) * 100
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>💰 Budget Manager</h1>
        <p className="subtitle">Track your spending and manage your budget</p>
      </header>

      {/* Summary Section */}
      <div className="summary-section">
        <div className="summary-card">
          <h3>Total Budget</h3>
          <p className="amount">${getTotalBudget().toFixed(2)}</p>
        </div>
        <div className="summary-card spent">
          <h3>Total Spent</h3>
          <p className="amount">${getTotalSpent().toFixed(2)}</p>
        </div>
        <div className={`summary-card ${getTotalRemaining() >= 0 ? 'remaining' : 'over'}`}>
          <h3>Remaining</h3>
          <p className="amount">${getTotalRemaining().toFixed(2)}</p>
        </div>
      </div>

      {/* Add Category Section */}
      <div className="add-category-section">
        <h2>Add New Category</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Category name (e.g., Food, Transport)"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="input-field"
          />
          <input
            type="number"
            placeholder="Budget amount"
            value={newCategoryBudget}
            onChange={(e) => setNewCategoryBudget(e.target.value)}
            className="input-field"
          />
          <button onClick={addCategory} className="btn btn-primary">Add Category</button>
        </div>
      </div>

      {/* Categories List */}
      <div className="categories-section">
        <h2>Budget Categories</h2>
        {categories.length === 0 ? (
          <p className="empty-state">No categories yet. Add one to get started!</p>
        ) : (
          <div className="categories-list">
            {categories.map(category => (
              <div key={category.id} className="category-card">
                <div className="category-header" onClick={() => setExpandedCategoryId(expandedCategoryId === category.id ? null : category.id)}>
                  <div className="category-info">
                    <h3>{category.name}</h3>
                    <p className="category-details">
                      ${getCategoryTotal(category).toFixed(2)} / ${category.budgetAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="category-actions">
                    <span className={`remaining ${getRemaining(category) < 0 ? 'over-budget' : ''}`}>
                      ${getRemaining(category).toFixed(2)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteCategory(category.id)
                      }}
                      className="btn btn-danger btn-small"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${getPercentageSpent(category) > 100 ? 'over-budget' : ''}`}
                      style={{ width: `${Math.min(getPercentageSpent(category), 100)}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{Math.round(getPercentageSpent(category))}%</span>
                </div>

                {/* Expanded Section */}
                {expandedCategoryId === category.id && (
                  <div className="category-expanded">
                    {/* Add Expense */}
                    <div className="expense-input-section">
                      <h4>Add Expense</h4>
                      <div className="input-group">
                        <input
                          type="text"
                          placeholder="Expense description"
                          value={newExpenseDesc}
                          onChange={(e) => setNewExpenseDesc(e.target.value)}
                          className="input-field"
                        />
                        <input
                          type="number"
                          placeholder="Amount"
                          value={newExpenseAmount}
                          onChange={(e) => setNewExpenseAmount(e.target.value)}
                          className="input-field"
                        />
                        <button
                          onClick={() => addExpense(category.id)}
                          className="btn btn-secondary"
                        >
                          Add Expense
                        </button>
                      </div>
                    </div>

                    {/* Expenses List */}
                    <div className="expenses-list">
                      <h4>Expenses ({category.expenses.length})</h4>
                      {category.expenses.length === 0 ? (
                        <p className="empty-state">No expenses yet</p>
                      ) : (
                        category.expenses.map(expense => (
                          <div key={expense.id} className="expense-item">
                            <div className="expense-details">
                              <span className="expense-desc">{expense.description}</span>
                              <span className="expense-date">{expense.date}</span>
                            </div>
                            <div className="expense-actions">
                              <span className="expense-amount">${expense.amount.toFixed(2)}</span>
                              <button
                                onClick={() => deleteExpense(category.id, expense.id)}
                                className="btn btn-danger btn-small"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
