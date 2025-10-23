import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Input, InputNumber, message, Modal } from 'antd';
import { CreditCardOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllPlans, createPlan, updatePlan, deletePlan, getAllUsers, getSuccessfulPayments } from '../utils/api';

const PlansPage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, usersRes, paymentsRes] = await Promise.all([
        getAllPlans(),
        getAllUsers(),
        getSuccessfulPayments()
      ]);
      
      setPlans(plansRes || []);
      
      let allUsers = usersRes.users || [];
      let payments = [];
      
      if (paymentsRes.success && paymentsRes.transactions) {
        payments = paymentsRes.transactions.filter(t => {
          const s = t.orderStatus?.toLowerCase();
          return s === 'paid' || s === 'success';
        });
      }
      
      const mergedUsers = allUsers.map(user => {
        const userPayment = payments.find(payment => 
          payment.customerDetails?.customer_email?.toLowerCase() === user.email?.toLowerCase()
        );
        
        if (userPayment) {
          return {
            ...user,
            orderAmount: userPayment.orderAmount,
            paymentOrderId: userPayment.orderId,
            paymentStatus: userPayment.orderStatus === 'PAID' || userPayment.orderStatus === 'SUCCESS' ? 'Paid' : user.paymentStatus,
          };
        }
        
        return user;
      });
      
      setUsers(mergedUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculatePlanStats = (plan) => {
    const planUsers = (users || []).filter(user => {
      const userPlanType = (user.planType || '').toLowerCase();
      const planTypeMatch = userPlanType === plan.planType.toLowerCase();
      const amountMatch = user.orderAmount === plan.amount || user.planAmount === plan.amount;
      return planTypeMatch || amountMatch;
    });

    const activeUsers = planUsers.filter(user => {
      const status = (user.accountStatus || '').toLowerCase();
      return status !== 'suspended' && status !== 'terminated';
    });

    const totalRevenue = planUsers.reduce((sum, user) => {
      return sum + (user.orderAmount || user.planAmount || 0);
    }, 0);

    return {
      totalUsers: planUsers.length,
      activeUsers: activeUsers.length,
      totalRevenue
    };
  };

  const handleAddPlan = async (values) => {
    try {
      if (values.features) {
        values.features = values.features.split('\n').filter(f => f.trim());
      }
      const created = await createPlan(values);
      message.success('Plan created successfully');
      modal.success({
        title: 'Plan Created',
        content: (
          <div>
            <p><strong>Plan:</strong> {created?.planType}</p>
            <p><strong>Amount:</strong> ₹{created?.amount}</p>
            <p><strong>Duration:</strong> {created?.duration} month{created?.duration > 1 ? 's' : ''}</p>
          </div>
        ),
      });
      setShowAddPlanModal(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Error creating plan:', error);
      message.error('Failed to create plan');
    }
  };

  const handleEditPlan = async (values) => {
    try {
      if (values.features) {
        values.features = values.features.split('\n').filter(f => f.trim());
      }
      await updatePlan(editingPlan._id, values);
      message.success('Plan updated successfully');
      setShowEditPlanModal(false);
      editForm.resetFields();
      setEditingPlan(null);
      fetchData();
    } catch (error) {
      console.error('Error updating plan:', error);
      message.error('Failed to update plan');
    }
  };

  const handleDeletePlan = (planId) => {
    modal.confirm({
      title: 'Delete Plan',
      content: 'Are you sure you want to delete this plan?',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deletePlan(planId);
          message.success('Plan deleted successfully');
          fetchData();
        } catch (error) {
          console.error('Error deleting plan:', error);
          message.error('Failed to delete plan');
        }
      },
    });
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    const formValues = {
      planType: plan.planType,
      amount: plan.amount,
      duration: plan.duration,
      features: plan.features && Array.isArray(plan.features) ? plan.features.join('\n') : '',
    };
    editForm.setFieldsValue(formValues);
    setShowEditPlanModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {modalContextHolder}
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <CreditCardOutlined className="text-3xl text-green-500" />
                <div>
                  <h1 className="text-3xl font-bold text-white">Plans Management</h1>
                  {plans.length > 0 && (
                    <p className="text-sm text-gray-400 mt-1">
                      Total: {plans.length} plans available
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setShowAddPlanModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <PlusOutlined />
                <span>Add Plan</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan, index) => {
                const stats = calculatePlanStats(plan);
                return (
                  <Card
                    key={plan._id || index}
                    className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-2 border-gray-700 rounded-xl bg-gray-800 relative group"
                    styles={{ body: { padding: '24px' } }}
                  >
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(plan);
                        }}
                        className="text-blue-400 hover:bg-blue-500/20 hover:text-blue-300"
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(plan._id);
                        }}
                        className="text-red-400 hover:bg-red-500/20"
                      />
                    </div>

                    <div className="text-center space-y-4">
                      <div className="text-4xl p-4 bg-green-500/20 text-green-400 rounded-full mx-auto w-fit">
                        <CreditCardOutlined />
                      </div>
                      
                      <div>
                        <h4 className="text-xl font-semibold text-white mb-2 capitalize">
                          {plan.planType} Plan
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="text-center">
                            <span className="text-3xl font-bold text-green-400">₹{plan.amount.toLocaleString()}</span>
                            <p className="text-sm text-gray-400 mt-1">{plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
                          </div>
                          
                          <div className="pt-3 border-t border-gray-700 space-y-1 text-gray-300">
                            <p className="text-sm">Total Users: <span className="font-semibold">{stats.totalUsers}</span></p>
                            <p className="text-sm">Active: <span className="font-semibold text-green-400">{stats.activeUsers}</span></p>
                            <p className="text-sm">Revenue: <span className="font-semibold text-green-400">₹{stats.totalRevenue.toLocaleString()}</span></p>
                          </div>
                          
                          {plan.features?.length > 0 && (
                            <div className="mt-3 text-xs text-gray-400 text-left">
                              {plan.features.slice(0, 2).map((f, i) => (
                                <div key={i} className="truncate">• {f}</div>
                              ))}
                              {plan.features.length > 2 && (
                                <div className="text-blue-400">+{plan.features.length - 2} more features</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {plans.length === 0 && !loading && (
              <div className="text-center py-20">
                <CreditCardOutlined className="text-8xl text-gray-600 mb-4" />
                <p className="text-gray-400 text-xl">No plans available</p>
                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="mt-6 flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
                >
                  <PlusOutlined />
                  <span>Create Your First Plan</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Plan Modal */}
      <Modal
        title="Add New Plan"
        open={showAddPlanModal}
        onCancel={() => {
          setShowAddPlanModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddPlan}
          className="space-y-4"
        >
          <Form.Item
            label="Plan Name"
            name="planType"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g., Basic, Premium, Pro" />
          </Form.Item>
          
          <Form.Item
            label="Amount (₹)"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              placeholder="999"
              min={1}
              className="w-full"
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            label="Duration (Months)"
            name="duration"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber
              placeholder="1"
              min={1}
              max={12}
              className="w-full"
            />
          </Form.Item>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => {
              setShowAddPlanModal(false);
              form.resetFields();
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Plan
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Plan Modal */}
      <Modal
        title="Edit Plan"
        open={showEditPlanModal}
        onCancel={() => {
          setShowEditPlanModal(false);
          editForm.resetFields();
          setEditingPlan(null);
        }}
        footer={null}
        width={500}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditPlan}
          className="space-y-4"
        >
          <Form.Item
            label="Plan Name"
            name="planType"
            rules={[{ required: true, message: 'Please enter plan name' }]}
          >
            <Input placeholder="e.g., Basic, Premium, Pro" />
          </Form.Item>
          
          <Form.Item
            label="Amount (₹)"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              placeholder="999"
              min={1}
              className="w-full"
              formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              parser={value => value.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>
          
          <Form.Item
            label="Duration (Months)"
            name="duration"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber
              placeholder="1"
              min={1}
              max={12}
              className="w-full"
            />
          </Form.Item>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button onClick={() => {
              setShowEditPlanModal(false);
              editForm.resetFields();
              setEditingPlan(null);
            }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Update Plan
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
};

export default PlansPage;
