import React, { useState, useEffect } from 'react';
import { Modal, Card, Table, Button, Form, Input, InputNumber, message } from 'antd';
import { CreditCardOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getAllPlans, createPlan, updatePlan, deletePlan } from '../utils/api';

const userColumns = [
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: 'Email',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: 'Status',
    dataIndex: 'accountStatus',
    key: 'accountStatus',
    render: (status) => (
      <span className={`capitalize ${status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
        {status || 'N/A'}
      </span>
    ),
  },
  {
    title: 'Plan Amount',
    dataIndex: 'orderAmount',
    key: 'orderAmount',
    render: (amount) => `₹${amount?.toLocaleString() || '0'}`,
  },
];

const PlansOverlay = ({ visible, onClose, users = [] }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planUsers, setPlanUsers] = useState([]);
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [showEditPlanModal, setShowEditPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    if (visible) {
      fetchPlans();
    }
  }, [visible]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await getAllPlans();
      setPlans(response || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      message.error('Failed to fetch plans');
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
      totalRevenue,
      users: planUsers
    };
  };

  // Removed handlePlanClick as we don't need it anymore

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
      fetchPlans();
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
      fetchPlans();
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
          fetchPlans();
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

  const handleDeleteClick = (e, plan) => {
    e.stopPropagation();
    handleDeletePlan(plan._id);
  };

  return (
    <>
      {modalContextHolder}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <CreditCardOutlined className="text-green-600" />
            <span className="text-xl font-semibold text-gray-900">
              Plans Management
            </span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        footer={null}
        width={900}
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-0"
      >
        <div className="max-h-[70vh] overflow-y-auto p-6">
          {!showAddPlanModal && !showEditPlanModal && !selectedPlan && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div className="text-center flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Plans Management</h3>
                {plans.length > 0 && (
                  <div className="mt-2 text-sm text-gray-500">
                    Total: {plans.length} plans available
                  </div>
                )}
              </div>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setShowAddPlanModal(true)}
                className="shrink-0"
              >
                Add Plan
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.map((plan, index) => {
                const stats = calculatePlanStats(plan);
                return (
                  <Card
                    key={plan._id || index}
                    className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border border-gray-200 rounded-lg relative group"
                  >
                    <div className="absolute top-2 right-2 flex gap-1 opacity-100">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(plan);
                        }}
                        className="text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                      />
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => handleDeleteClick(e, plan)}
                        className="text-red-500 hover:bg-red-50"
                      />
                    </div>

                    <div className="text-center space-y-3">
                      <div className="text-3xl p-3 bg-green-50 text-green-500 rounded-full mx-auto w-fit">
                        <CreditCardOutlined />
                      </div>
                      
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
                          {plan.planType} Plan
                        </h4>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-gray-900 group-hover:text-green-600">{plan.planType}</h3>
                              <p className="text-sm text-gray-500">{plan.duration} month{plan.duration > 1 ? 's' : ''}</p>
                              {plan.features?.length > 0 && (
                                <div className="mt-2 text-xs text-gray-500">
                                  {plan.features.slice(0, 2).map((f, i) => (
                                    <div key={i} className="truncate">• {f}</div>
                                  ))}
                                  {plan.features.length > 2 && (
                                    <div className="text-blue-500">+{plan.features.length - 2} more</div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-bold text-green-600">₹{plan.amount.toLocaleString()}</span>
                              <div className="text-xs text-gray-400 mt-1">
                                {stats.totalUsers} users
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
            
            {plans.length === 0 && !loading && (
              <div className="text-center py-12">
                <CreditCardOutlined className="text-6xl text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No plans available</p>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => setShowAddPlanModal(true)}
                  className="mt-4"
                >
                  Create Your First Plan
                </Button>
              </div>
            )}
          </div>
        )}
        
        {selectedPlan && !showEditPlanModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedPlan(null);
                    setPlanUsers([]);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Back to plans"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">
                    {selectedPlan.planType} Plan
                  </h3>
                  <p className="text-gray-600">
                    ₹{selectedPlan.amount} • {selectedPlan.duration} month{selectedPlan.duration !== 1 ? 's' : ''} • {selectedPlan.totalUsers} users
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-xl font-bold text-blue-600">₹{selectedPlan.totalRevenue?.toLocaleString() || '0'}</p>
              </div>
            </div>
            
            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <Table
                columns={userColumns}
                dataSource={planUsers}
                rowKey="_id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} users`
                }}
                scroll={{ 
                  x: 'max-content',
                  y: 400
                }}
                className="[&_.ant-table-thead>tr>th]:bg-gray-50 [&_.ant-table-thead>tr>th]:text-gray-600 [&_.ant-table-tbody>tr>td]:text-gray-700"
              />
            </div>
          </div>
          )}
        </div>
      </Modal>

      <Modal
        title="Add New Plan"
        open={showAddPlanModal}
        onCancel={() => {
          setShowAddPlanModal(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
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
        className="[&_.ant-modal-content]:p-0 [&_.ant-modal-header]:p-4 [&_.ant-modal-header]:border-b [&_.ant-modal-header]:border-gray-200 [&_.ant-modal-body]:p-6"
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

export default PlansOverlay;