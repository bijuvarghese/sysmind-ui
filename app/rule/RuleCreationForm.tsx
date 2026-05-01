"use client";

import { useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    SvgIcon,
    TextField,
    Typography,
} from "@mui/material";
import type { SvgIconProps } from "@mui/material/SvgIcon";

type LogicalOperator = "and" | "or";

type Condition = {
    id: string;
    field: string;
    operator: string;
    value: string;
};

type ConditionGroup = {
    id: string;
    joinWith: LogicalOperator;
    match: LogicalOperator;
    conditions: Condition[];
};

const createCondition = (id: string): Condition => ({
    id,
    field: "amount",
    operator: "greater_than",
    value: "",
});

function AddIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2Z" />
        </SvgIcon>
    );
}

function DeleteIcon(props: SvgIconProps) {
    return (
        <SvgIcon {...props}>
            <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12ZM8 9h8v10H8V9Zm7.5-5-1-1h-5l-1 1H5v2h14V4h-3.5Z" />
        </SvgIcon>
    );
}

export default function RuleCreationForm() {
    const [ruleName, setRuleName] = useState("");
    const [conditionGroups, setConditionGroups] = useState<ConditionGroup[]>([
        {
            id: "group-1",
            joinWith: "and",
            match: "and",
            conditions: [createCondition("condition-1")],
        },
    ]);
    const [nextGroupId, setNextGroupId] = useState(2);
    const [nextConditionId, setNextConditionId] = useState(2);
    const [action, setAction] = useState("notify");

    const addGroup = () => {
        setConditionGroups((currentGroups) => [
            ...currentGroups,
            {
                id: `group-${nextGroupId}`,
                joinWith: "and",
                match: "and",
                conditions: [createCondition(`condition-${nextConditionId}`)],
            },
        ]);
        setNextGroupId((currentId) => currentId + 1);
        setNextConditionId((currentId) => currentId + 1);
    };

    const removeGroup = (groupId: string) => {
        setConditionGroups((currentGroups) =>
            currentGroups.filter((group) => group.id !== groupId)
        );
    };

    const updateGroup = <Key extends keyof ConditionGroup>(
        groupId: string,
        key: Key,
        value: ConditionGroup[Key]
    ) => {
        setConditionGroups((currentGroups) =>
            currentGroups.map((group) =>
                group.id === groupId ? { ...group, [key]: value } : group
            )
        );
    };

    const addCondition = (groupId: string) => {
        setConditionGroups((currentGroups) =>
            currentGroups.map((group) =>
                group.id === groupId
                    ? {
                          ...group,
                          conditions: [
                              ...group.conditions,
                              createCondition(`condition-${nextConditionId}`),
                          ],
                      }
                    : group
            )
        );
        setNextConditionId((currentId) => currentId + 1);
    };

    const removeCondition = (groupId: string, conditionId: string) => {
        setConditionGroups((currentGroups) =>
            currentGroups.map((group) =>
                group.id === groupId
                    ? {
                          ...group,
                          conditions: group.conditions.filter(
                              (condition) => condition.id !== conditionId
                          ),
                      }
                    : group
            )
        );
    };

    const updateCondition = <Key extends keyof Condition>(
        groupId: string,
        conditionId: string,
        key: Key,
        value: Condition[Key]
    ) => {
        setConditionGroups((currentGroups) =>
            currentGroups.map((group) =>
                group.id === groupId
                    ? {
                          ...group,
                          conditions: group.conditions.map((condition) =>
                              condition.id === conditionId
                                  ? { ...condition, [key]: value }
                                  : condition
                          ),
                      }
                    : group
            )
        );
    };

    const handleSave = () => {
        const rule = {
            name: ruleName,
            conditionGroups,
            action,
        };

        console.log("Created Rule:", rule);
    };

    return (
        <Box sx={{ maxWidth: 900, mx: "auto", p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                Create Rule
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Define conditions and choose what should happen when they match.
            </Typography>

            <Card elevation={3}>
                <CardContent>
                    <Stack spacing={3}>
                        <TextField
                            id="rule-name"
                            name="ruleName"
                            label="Rule Name"
                            value={ruleName}
                            onChange={(e) => setRuleName(e.target.value)}
                            placeholder="Example: High value order alert"
                            fullWidth
                        />

                        <Divider />

                        <Box>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                                <Typography variant="h6">Conditions</Typography>
                                <Chip label="IF" color="primary" size="small" />
                            </Stack>

                            <Stack spacing={2}>
                                {conditionGroups.map((group, groupIndex) => (
                                    <Box
                                        key={group.id}
                                        sx={{
                                            border: "1px solid",
                                            borderColor: "divider",
                                            borderRadius: 2,
                                            p: 2,
                                        }}
                                    >
                                        <Stack
                                            direction={{ xs: "column", md: "row" }}
                                            spacing={2}
                                            sx={{
                                                alignItems: { xs: "stretch", md: "center" },
                                                mb: 2,
                                            }}
                                        >
                                            {groupIndex === 0 ? (
                                                <Chip
                                                    label="IF"
                                                    color="primary"
                                                    size="small"
                                                    sx={{ alignSelf: { xs: "flex-start", md: "center" } }}
                                                />
                                            ) : (
                                                <FormControl sx={{ minWidth: 140 }}>
                                                    <InputLabel id={`${group.id}-join-label`}>
                                                        Join Group
                                                    </InputLabel>
                                                    <Select
                                                        id={`${group.id}-join`}
                                                        name={`${group.id}-join`}
                                                        labelId={`${group.id}-join-label`}
                                                        label="Join Group"
                                                        value={group.joinWith}
                                                        onChange={(e) =>
                                                            updateGroup(
                                                                group.id,
                                                                "joinWith",
                                                                e.target.value as LogicalOperator
                                                            )
                                                        }
                                                    >
                                                        <MenuItem value="and">AND</MenuItem>
                                                        <MenuItem value="or">OR</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            )}

                                            <FormControl sx={{ minWidth: 180 }}>
                                                <InputLabel id={`${group.id}-match-label`}>
                                                    Group Match
                                                </InputLabel>
                                                <Select
                                                    id={`${group.id}-match`}
                                                    name={`${group.id}-match`}
                                                    labelId={`${group.id}-match-label`}
                                                    label="Group Match"
                                                    value={group.match}
                                                    onChange={(e) =>
                                                        updateGroup(
                                                            group.id,
                                                            "match",
                                                            e.target.value as LogicalOperator
                                                        )
                                                    }
                                                >
                                                    <MenuItem value="and">All conditions</MenuItem>
                                                    <MenuItem value="or">Any condition</MenuItem>
                                                </Select>
                                            </FormControl>

                                            <Button
                                                variant="outlined"
                                                color="error"
                                                onClick={() => removeGroup(group.id)}
                                                disabled={conditionGroups.length === 1}
                                                sx={{ ml: { md: "auto" } }}
                                            >
                                                Remove Group
                                            </Button>
                                        </Stack>

                                        <Stack spacing={2}>
                                            {group.conditions.map((condition) => (
                                                <Grid
                                                    container
                                                    spacing={2}
                                                    sx={{ alignItems: "center" }}
                                                    key={condition.id}
                                                >
                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <FormControl fullWidth>
                                                            <InputLabel id={`${condition.id}-field-label`}>
                                                                Field
                                                            </InputLabel>
                                                            <Select
                                                                id={`${condition.id}-field`}
                                                                name={`${condition.id}-field`}
                                                                labelId={`${condition.id}-field-label`}
                                                                label="Field"
                                                                value={condition.field}
                                                                onChange={(e) =>
                                                                    updateCondition(
                                                                        group.id,
                                                                        condition.id,
                                                                        "field",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            >
                                                                <MenuItem value="amount">Amount</MenuItem>
                                                                <MenuItem value="status">Status</MenuItem>
                                                                <MenuItem value="customerType">
                                                                    Customer Type
                                                                </MenuItem>
                                                                <MenuItem value="location">Location</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 3 }}>
                                                        <FormControl fullWidth>
                                                            <InputLabel id={`${condition.id}-operator-label`}>
                                                                Operator
                                                            </InputLabel>
                                                            <Select
                                                                id={`${condition.id}-operator`}
                                                                name={`${condition.id}-operator`}
                                                                labelId={`${condition.id}-operator-label`}
                                                                label="Operator"
                                                                value={condition.operator}
                                                                onChange={(e) =>
                                                                    updateCondition(
                                                                        group.id,
                                                                        condition.id,
                                                                        "operator",
                                                                        e.target.value
                                                                    )
                                                                }
                                                            >
                                                                <MenuItem value="equals">Equals</MenuItem>
                                                                <MenuItem value="not_equals">Not Equals</MenuItem>
                                                                <MenuItem value="greater_than">
                                                                    Greater Than
                                                                </MenuItem>
                                                                <MenuItem value="less_than">Less Than</MenuItem>
                                                                <MenuItem value="contains">Contains</MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 5 }}>
                                                        <TextField
                                                            id={`${condition.id}-value`}
                                                            name={`${condition.id}-value`}
                                                            label="Value"
                                                            value={condition.value}
                                                            onChange={(e) =>
                                                                updateCondition(
                                                                    group.id,
                                                                    condition.id,
                                                                    "value",
                                                                    e.target.value
                                                                )
                                                            }
                                                            fullWidth
                                                        />
                                                    </Grid>

                                                    <Grid size={{ xs: 12, md: 1 }}>
                                                        <IconButton
                                                            color="error"
                                                            onClick={() =>
                                                                removeCondition(group.id, condition.id)
                                                            }
                                                            disabled={group.conditions.length === 1}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Grid>
                                                </Grid>
                                            ))}
                                        </Stack>

                                        <Button
                                            startIcon={<AddIcon />}
                                            onClick={() => addCondition(group.id)}
                                            sx={{ mt: 2 }}
                                        >
                                            Add Condition
                                        </Button>
                                    </Box>
                                ))}
                            </Stack>

                            <Button
                                startIcon={<AddIcon />}
                                onClick={addGroup}
                                sx={{ mt: 2 }}
                            >
                                Add Group
                            </Button>
                        </Box>

                        <Divider />

                        <Box>
                            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
                                <Typography variant="h6">Action</Typography>
                                <Chip label="THEN" color="success" size="small" />
                            </Stack>

                            <FormControl fullWidth>
                                <InputLabel id="rule-action-label">Action</InputLabel>
                                <Select
                                    id="rule-action"
                                    name="ruleAction"
                                    labelId="rule-action-label"
                                    label="Action"
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                >
                                    <MenuItem value="notify">Send Notification</MenuItem>
                                    <MenuItem value="email">Send Email</MenuItem>
                                    <MenuItem value="flag">Flag Record</MenuItem>
                                    <MenuItem value="block">Block Request</MenuItem>
                                    <MenuItem value="approve">Auto Approve</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>

                        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
                            <Button variant="outlined">Cancel</Button>
                            <Button variant="contained" onClick={handleSave}>
                                Save Rule
                            </Button>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
        </Box>
    );
}
